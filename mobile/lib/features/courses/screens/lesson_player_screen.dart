import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/learning_provider.dart';
import '../services/learning_service.dart';

String _formatTime(int? seconds) {
  final safeSeconds = (seconds ?? 0).clamp(0, 999999);
  final h = safeSeconds ~/ 3600;
  final m = (safeSeconds % 3600) ~/ 60;
  final s = safeSeconds % 60;
  if (h > 0) {
    return '$h:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
  return '$m:${s.toString().padLeft(2, '0')}';
}

String _formatDate(String? date) {
  if (date == null || date.isEmpty) return '';
  final dt = DateTime.tryParse(date);
  if (dt == null) return '';
  final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${months[dt.month - 1]} ${dt.day}, ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
}

String? _extractYoutubeId(String? url) {
  if (url == null || url.isEmpty) return null;
  final uri = Uri.tryParse(url);
  if (uri == null) return null;
  if (uri.host.contains('youtube.com')) {
    if (uri.path.contains('/embed/')) {
      return uri.pathSegments.last;
    }
    return uri.queryParameters['v'];
  }
  if (uri.host.contains('youtu.be')) {
    return uri.pathSegments.first;
  }
  return null;
}

class LessonPlayerScreen extends ConsumerStatefulWidget {
  const LessonPlayerScreen({super.key});

  @override
  ConsumerState<LessonPlayerScreen> createState() => _LessonPlayerScreenState();
}

class _LessonPlayerScreenState extends ConsumerState<LessonPlayerScreen> {
  YoutubePlayerController? _youtubeController;
  StreamSubscription<YoutubePlayerValue>? _controllerSubscription;
  StreamSubscription<YoutubeVideoState>? _videoStateSubscription;
  Timer? _watchTimer;
  Timer? _syncTimer;
  Timer? _watermarkTimer;
  int _watermarkIndex = 0;
  bool _youtubeReady = false;
  int _localWatchSeconds = 0;
  Map<String, String> _args = {};

  static const List<_WatermarkPosition> _watermarkPositions = [
    _WatermarkPosition(4, 4),
    _WatermarkPosition(64, 8),
    _WatermarkPosition(12, 46),
    _WatermarkPosition(52, 58),
    _WatermarkPosition(34, 28),
    _WatermarkPosition(72, 42),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final routeArgs = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
      if (routeArgs != null) {
        _args = {
          'slug': routeArgs['slug'] as String? ?? '',
          'lessonId': routeArgs['lessonId'] as String? ?? '',
        };
      }
      _initPlayer();
    });
  }

  @override
  void dispose() {
    _controllerSubscription?.cancel();
    _videoStateSubscription?.cancel();
    _youtubeController?.close();
    _watchTimer?.cancel();
    _syncTimer?.cancel();
    _watermarkTimer?.cancel();
    super.dispose();
  }

  LearningPlayerNotifier get _notifier => ref.read(learningPlayerProvider(_args).notifier);

  void _initPlayer() {
    final state = ref.read(learningPlayerProvider(_args));
    final videoUrl = state.playerData?.lesson.videoEmbedUrl;
    final videoId = _extractYoutubeId(videoUrl);
    if (videoId == null) return;

    _youtubeController = YoutubePlayerController.fromVideoId(
      videoId: videoId,
      params: const YoutubePlayerParams(
        showControls: false,
        showFullscreenButton: false,
      ),
      autoPlay: false,
    );

    _controllerSubscription = _youtubeController!.listen((value) {
      if (!_youtubeReady && value.playerState != PlayerState.unknown) {
        _youtubeReady = true;
        final lesson = state.playerData?.lesson;
        if (lesson?.watchSeconds != null && lesson!.watchSeconds! > 0) {
          _youtubeController!.seekTo(seconds: lesson.watchSeconds!.toDouble());
        }
      }

      final playerState = value.playerState;
      final notifier = _notifier;
      if (playerState == PlayerState.playing) {
        notifier.setIsPlaying(true);
        notifier.setIsTracking(true);
        _startWatchTimer();
        _startSyncTimer();
      } else if (playerState == PlayerState.paused) {
        notifier.setIsPlaying(false);
        notifier.setIsTracking(false);
        _stopWatchTimer();
        _stopSyncTimer();
        notifier.syncWatchTime();
      } else if (playerState == PlayerState.ended) {
        notifier.setIsPlaying(false);
        notifier.setIsTracking(false);
        _stopWatchTimer();
        _stopSyncTimer();
        final duration = state.playerData?.lesson.duration ?? _localWatchSeconds;
        notifier.setWatchSeconds(duration);
        notifier.syncWatchTime();
        _markCompleteOnEnd();
      }
    });

    _watermarkTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      setState(() {
        _watermarkIndex = (_watermarkIndex + 1) % _watermarkPositions.length;
      });
    });
  }

  void _startWatchTimer() {
    _watchTimer?.cancel();
    _watchTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      if (_youtubeController != null && _youtubeReady) {
        final currentTime = await _youtubeController!.currentTime;
        _localWatchSeconds = currentTime.toInt();
        _notifier.setWatchSeconds(currentTime.toInt());
      }
    });
  }

  void _stopWatchTimer() {
    _watchTimer?.cancel();
    _watchTimer = null;
  }

  void _startSyncTimer() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _notifier.syncWatchTime();
    });
  }

  void _stopSyncTimer() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  Future<void> _markCompleteOnEnd() async {
    final notifier = _notifier;
    try {
      await notifier.syncWatchTime();
      await notifier.markComplete();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lesson completed automatically.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lesson auto-complete failed.')),
        );
      }
    }
  }

  void _togglePlayback() {
    final state = ref.read(learningPlayerProvider(_args));
    if (_youtubeController == null || !_youtubeReady) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video player is loading. Please try again.')),
      );
      return;
    }
    if (state.isPlaying) {
      _youtubeController!.pauseVideo();
    } else {
      _youtubeController!.playVideo();
    }
  }

  void _seekVideo(double positionPercent) {
    if (_youtubeController == null || !_youtubeReady) return;
    final duration = ref.read(learningPlayerProvider(_args)).duration;
    if (duration <= 0) return;
    final seconds = (positionPercent * duration).round();
    _youtubeController!.seekTo(seconds: seconds.toDouble());
    _notifier.setWatchSeconds(seconds);
    _notifier.syncWatchTime();
  }

  void _navigateToLesson(String lessonId) {
    _controllerSubscription?.cancel();
    _videoStateSubscription?.cancel();
    _youtubeController?.pauseVideo();
    _youtubeController?.close();
    _youtubeController = null;
    _youtubeReady = false;
    _stopWatchTimer();
    _stopSyncTimer();
    setState(() {
      _args = {..._args, 'lessonId': lessonId};
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _initPlayer());
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(learningPlayerProvider(_args));
    final notifier = ref.read(learningPlayerProvider(_args).notifier);

    if (provider.isLoading && provider.playerData == null) {
      return const Scaffold(body: _PlayerShimmer());
    }

    if (provider.error != null && provider.playerData == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: ErrorDisplayWidget(
          message: provider.error!,
          onRetry: provider.timeoutReached ? () => notifier.loadPlayer() : null,
        ),
      );
    }

    if (provider.isCurriculumEmpty || provider.playerData == null) {
      final errorMessage = provider.error ?? 'No lessons available yet.';
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.folder_open, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  provider.isCurriculumEmpty ? 'No lessons available yet' : 'Classes are not added yet',
                  style: AppTextStyles.titleMedium.copyWith(color: AppColors.foreground),
                ),
                const SizedBox(height: 8),
                Text(
                  errorMessage,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Go back'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    final playerData = provider.playerData!;
    final lesson = playerData.lesson;
    final course = playerData.course;
    final videoUrl = lesson.videoEmbedUrl;
    final videoId = _extractYoutubeId(videoUrl);
    final watchPercent = provider.watchPercent;
    final duration = provider.duration;
    final isCompleted = lesson.isCompleted == true;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          course.title,
          style: AppTextStyles.titleSmall,
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildVideoPlayer(videoId, videoUrl, watchPercent, duration, provider.isPlaying),
                  _buildLessonInfo(lesson, course, isCompleted, notifier, provider.isSaving),
                  _buildTabBar(provider.activeTab, notifier),
                  _buildTabContent(provider, notifier),
                ],
              ),
            ),
          ),
          _buildBottomNavBar(provider, notifier),
        ],
      ),
    );
  }

  Widget _buildVideoPlayer(String? videoId, String? videoUrl, int watchPercent, int duration, bool isPlaying) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final playerWidth = constraints.maxWidth;
        final playerHeight = playerWidth * 9 / 16;

        return SizedBox(
          width: playerWidth,
          height: playerHeight,
          child: Stack(
            children: [
              Container(
                width: playerWidth,
                height: playerHeight,
                color: Colors.black,
                child: videoId != null && _youtubeController != null
                    ? YoutubePlayer(
                        controller: _youtubeController!,
                        aspectRatio: 16 / 9,
                      )
                    : Center(
                        child: Text(
                          videoUrl != null && videoUrl.isNotEmpty
                              ? 'Video unavailable'
                              : 'Video is not available for this lesson.',
                          style: const TextStyle(color: Color(0xFFD4D4D8), fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                      ),
              ),
              if (videoId != null && _youtubeReady)
                Positioned(
                  left: _watermarkPositions[_watermarkIndex].leftPercent,
                  top: _watermarkPositions[_watermarkIndex].topPercent,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 800),
                    curve: Curves.easeInOut,
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      ref.read(learningPlayerProvider(_args)).playerData?.watermark.email ??
                          ref.read(learningPlayerProvider(_args)).playerData?.watermark.name ??
                          '',
                      style: const TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 9,
                        color: Color(0xFFCCCCCC),
                      ),
                    ),
                  ),
                ),
              if (videoId != null && _youtubeReady)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xCC000000)],
                      ),
                    ),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: _togglePlayback,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                              size: 18,
                              color: Colors.black,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${_formatTime(_localWatchSeconds)} / ${_formatTime(duration)}',
                          style: const TextStyle(
                            fontFamily: 'JetBrains Mono',
                            fontSize: 11,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: GestureDetector(
                            onTapDown: (details) {
                              final box = context.findRenderObject() as RenderBox;
                              final localPos = box.globalToLocal(details.globalPosition);
                              final percent = (localPos.dx / playerWidth).clamp(0.0, 1.0);
                              _seekVideo(percent);
                            },
                            child: Container(
                              height: 8,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Stack(
                                children: [
                                  FractionallySizedBox(
                                    alignment: Alignment.centerLeft,
                                    widthFactor: watchPercent / 100.0,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$watchPercent%',
                          style: const TextStyle(
                            fontFamily: 'JetBrains Mono',
                            fontSize: 11,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLessonInfo(PlayerLesson lesson, PlayerCourse course, bool isCompleted,
      LearningPlayerNotifier notifier, bool isSaving) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lesson.title,
                  style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  '${course.title}${course.instructor?.name != null ? ' · ${course.instructor!.name}' : ''}',
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          FilledButton.icon(
            onPressed: isCompleted || isSaving ? null : () => notifier.markComplete(),
            icon: isSaving
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Icon(isCompleted ? Icons.check_circle : Icons.check, size: 16),
            label: Text(
              isCompleted ? 'Completed' : 'Mark as Completed',
              style: AppTextStyles.labelSmall,
            ),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              backgroundColor: isCompleted ? AppColors.success : AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(String activeTab, LearningPlayerNotifier notifier) {
    final tabs = [
      ('overview', 'Overview', Icons.description_outlined),
      ('notes', 'Notes', Icons.notes_outlined),
      ('qna', 'Q&A', Icons.question_answer_outlined),
      ('resourcesTab', 'Resources', Icons.folder_outlined),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: tabs.map((tab) {
          final isActive = activeTab == tab.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 4),
            child: GestureDetector(
              onTap: () => notifier.setActiveTab(tab.$1),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      tab.$3,
                      size: 14,
                      color: isActive ? AppColors.primary : AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      tab.$2,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: isActive ? AppColors.primary : AppColors.mutedForeground,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabContent(LearningPlayerState state, LearningPlayerNotifier notifier) {
    switch (state.activeTab) {
      case 'notes':
        return _buildNotesTab(state, notifier);
      case 'qna':
        return _buildQnATab(state, notifier);
      case 'resourcesTab':
        return _buildResourcesTab(state);
      default:
        return _buildOverviewTab(state);
    }
  }

  Widget _buildOverviewTab(LearningPlayerState state) {
    final lesson = state.playerData?.lesson;
    final course = state.playerData?.course;
    final duration = state.duration;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            lesson?.content ?? course?.description ?? 'No lesson overview added yet.',
            style: AppTextStyles.bodyMedium.copyWith(height: 1.6),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: AppColors.mutedForeground),
              const SizedBox(width: 4),
              Text(
                'Lesson duration: ${_formatTime(duration)}',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotesTab(LearningPlayerState state, LearningPlayerNotifier notifier) {
    final notes = state.playerData?.lesson.notes ?? [];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: TextEditingController.fromValue(
                    TextEditingValue(
                      text: state.noteText,
                      selection: TextSelection.collapsed(offset: state.noteText.length),
                    ),
                  ),
                  onChanged: (v) => notifier.setNoteText(v),
                  decoration: InputDecoration(
                    hintText: 'Add a note at ${_formatTime(state.watchSeconds)}',
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  style: AppTextStyles.bodySmall,
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: state.isSaving ? null : () => notifier.saveNote(),
                icon: state.isSaving
                    ? const SizedBox(
                        width: 14, height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.save, size: 14),
                label: Text('Save', style: AppTextStyles.labelSmall),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (notes.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'No notes saved yet.',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
              ),
            )
          else
            ...notes.map((note) => _buildNoteItem(note, notifier)),
        ],
      ),
    );
  }

  Widget _buildNoteItem(LessonNote note, LearningPlayerNotifier notifier) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(10),
          color: AppColors.secondary.withValues(alpha: 0.3),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _formatTime(note.timestampSeconds),
                      style: AppTextStyles.labelSmall.copyWith(
                        fontFamily: 'JetBrains Mono',
                        color: AppColors.primary,
                        fontSize: 9,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(note.note, style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => notifier.deleteNote(note.id),
              child: Icon(Icons.delete_outline, size: 16, color: AppColors.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQnATab(LearningPlayerState state, LearningPlayerNotifier notifier) {
    final questions = state.questions;
    final visibleQuestions = state.visibleQuestions;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: TextEditingController.fromValue(
              TextEditingValue(
                text: state.questionText,
                selection: TextSelection.collapsed(offset: state.questionText.length),
              ),
            ),
            onChanged: (v) => notifier.setQuestionText(v),
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Ask a question about this lesson...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            style: AppTextStyles.bodySmall,
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: state.isSaving ? null : () => notifier.askQuestion(),
            icon: state.isSaving
                ? const SizedBox(
                    width: 14, height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.send, size: 14),
            label: Text('Submit Question', style: AppTextStyles.labelSmall),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 16),
          if (questions.isEmpty)
            Text(
              'No questions yet.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
            )
          else
            ...visibleQuestions.map((q) => _buildQuestionItem(q)),
          if (questions.length > state.questionsPerPage)
            _buildQuestionPagination(state, notifier),
        ],
      ),
    );
  }

  Widget _buildQuestionItem(LessonQuestion question) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        question.user?.name ?? 'Student',
                        style: AppTextStyles.labelLarge.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(question.question, style: AppTextStyles.bodySmall),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    question.status.toUpperCase(),
                    style: AppTextStyles.labelSmall.copyWith(fontSize: 8, letterSpacing: 0.5),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...question.answers.map((answer) => _buildAnswerItem(answer)),
            if (question.answers.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Instructor answer pending.',
                  style: AppTextStyles.bodySmall.copyWith(
                    fontSize: 10,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnswerItem(LessonAnswer answer) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                answer.user?.name ?? 'iLab',
                style: AppTextStyles.labelSmall.copyWith(fontWeight: FontWeight.w700),
              ),
              if (answer.isInstructorAnswer) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Instructor',
                    style: AppTextStyles.labelSmall.copyWith(
                      fontSize: 8,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Text(answer.answer, style: AppTextStyles.bodySmall.copyWith(fontSize: 11)),
          if (answer.createdAt != null) ...[
            const SizedBox(height: 4),
            Text(
              _formatDate(answer.createdAt),
              style: AppTextStyles.bodySmall.copyWith(fontSize: 9, color: AppColors.mutedForeground),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuestionPagination(LearningPlayerState state, LearningPlayerNotifier notifier) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Page ${state.questionPage} of ${state.totalQuestionPages}',
            style: AppTextStyles.bodySmall.copyWith(fontSize: 10, color: AppColors.mutedForeground),
          ),
          Row(
            children: [
              OutlinedButton(
                onPressed: state.questionPage > 1
                    ? () => notifier.setQuestionPage(state.questionPage - 1)
                    : null,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('Previous', style: AppTextStyles.labelSmall),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: state.questionPage < state.totalQuestionPages
                    ? () => notifier.setQuestionPage(state.questionPage + 1)
                    : null,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('Next', style: AppTextStyles.labelSmall),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResourcesTab(LearningPlayerState state) {
    final resources = state.playerData?.lesson.resources ?? [];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: resources.isEmpty
          ? Text(
              'No resources added yet.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
            )
          : Column(
              children: resources.map((r) => _buildResourceItem(r)).toList(),
            ),
    );
  }

  Widget _buildResourceItem(LessonResource resource) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.description_outlined, size: 20, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  resource.title,
                  style: AppTextStyles.labelLarge.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${resource.type.replaceAll('_', ' ')}${resource.fileSize != null ? ' · ${resource.fileSize}' : ''}',
                  style: AppTextStyles.bodySmall.copyWith(fontSize: 10, color: AppColors.mutedForeground),
                ),
              ],
            ),
          ),
          Icon(Icons.open_in_new, size: 16, color: AppColors.mutedForeground),
        ],
      ),
    );
  }

  Widget _buildBottomNavBar(LearningPlayerState state, LearningPlayerNotifier notifier) {
    final prev = state.previousLesson;
    final next = state.nextLesson;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              if (prev != null)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _navigateToLesson(prev.id.toString()),
                    icon: const Icon(Icons.chevron_left, size: 16),
                    label: Text('Previous', style: AppTextStyles.labelSmall),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              if (prev != null && next != null) const SizedBox(width: 8),
              if (next != null)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _navigateToLesson(next.id.toString()),
                    icon: const Icon(Icons.chevron_right, size: 16),
                    label: Text('Next', style: AppTextStyles.labelSmall),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showSyllabusSheet(context, state, notifier),
              icon: const Icon(Icons.list_alt_rounded, size: 16),
              label: Text('Course Content', style: AppTextStyles.labelSmall),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSyllabusSheet(BuildContext context, LearningPlayerState state, LearningPlayerNotifier notifier) {
    final sections = state.playerData?.course.sections ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.mutedForeground.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Course Content',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      children: sections.map((section) => _buildSyllabusSection(section, state, notifier)).toList(),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSyllabusSection(PlayerSection section, LearningPlayerState state, LearningPlayerNotifier notifier) {
    final isExpanded = state.expandedModules.contains(section.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => notifier.toggleModule(section.id),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.vertical(
                  top: isExpanded ? const Radius.circular(12) : const Radius.circular(12),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_more : Icons.chevron_right,
                    size: 18,
                    color: AppColors.mutedForeground,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      section.title,
                      style: AppTextStyles.labelLarge.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded)
            ...section.lessons.map((lesson) => _buildSyllabusLesson(lesson, state, notifier)),
        ],
      ),
    );
  }

  Widget _buildSyllabusLesson(PlayerLesson lesson, LearningPlayerState state, LearningPlayerNotifier notifier) {
    final isActive = lesson.id.toString() == state.currentLessonId;
    final isDisabled = lesson.isAvailable == false;

    return GestureDetector(
      onTap: isDisabled
          ? null
          : () {
              if (isActive) {
                Navigator.of(context).pop();
                return;
              }
              Navigator.of(context).pop();
              _navigateToLesson(lesson.id.toString());
            },
      child: Container(
        padding: const EdgeInsets.only(left: 36, right: 12, top: 10, bottom: 10),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withValues(alpha: 0.08) : null,
          border: Border(
            bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.2)),
          ),
        ),
        child: Row(
          children: [
            Icon(
              lesson.isCompleted == true ? Icons.check_circle : Icons.play_circle_outline,
              size: 18,
              color: lesson.isCompleted == true
                  ? AppColors.success
                  : isActive
                      ? AppColors.primary
                      : AppColors.mutedForeground,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${lesson.title}${isDisabled ? ' (Not added)' : ''}',
                style: AppTextStyles.bodySmall.copyWith(
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive
                      ? AppColors.primary
                      : isDisabled
                          ? AppColors.mutedForeground.withValues(alpha: 0.5)
                          : AppColors.foreground,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (lesson.duration != null)
              Text(
                _formatTime(lesson.duration),
                style: AppTextStyles.bodySmall.copyWith(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 9,
                  color: AppColors.mutedForeground,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _WatermarkPosition {
  final double leftPercent;
  final double topPercent;
  const _WatermarkPosition(this.leftPercent, this.topPercent);
}

class _PlayerShimmer extends StatelessWidget {
  const _PlayerShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerCard(height: 200, width: double.infinity),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerCard(height: 20, width: 200),
                const SizedBox(height: 8),
                const ShimmerCard(height: 14, width: 300),
                const SizedBox(height: 16),
                const ShimmerCard(height: 40, width: double.infinity),
                const SizedBox(height: 16),
                const ShimmerCard(height: 100, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 100, width: double.infinity),
                const SizedBox(height: 8),
                const ShimmerCard(height: 100, width: double.infinity),
              ],
            ),
          ),
        ],
      ),
    );
  }
}