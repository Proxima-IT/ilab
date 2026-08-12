import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../config/api_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/services/api_client.dart';

const Color _authPrimary = Color(0xFFF46423);
const Color _authPrimaryDark = Color(0xFFD4541C);

class _NotificationTile {
  final IconData icon;
  final String label;
  final String subtitle;
  final String key;

  const _NotificationTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.key,
  });
}

const List<_NotificationTile> _tiles = [
  _NotificationTile(icon: Icons.email_outlined, label: 'Email notifications', subtitle: 'Receive updates via email', key: 'email'),
  _NotificationTile(icon: Icons.smartphone_outlined, label: 'Push notifications', subtitle: 'Receive push alerts', key: 'push'),
  _NotificationTile(icon: Icons.notifications_active_outlined, label: 'New lecture added', subtitle: 'When a new lecture is published', key: 'new_lecture'),
  _NotificationTile(icon: Icons.local_offer_outlined, label: 'Special offers', subtitle: 'Promotions and discounts', key: 'special_offer'),
  _NotificationTile(icon: Icons.event_outlined, label: 'Events', subtitle: 'Upcoming events and webinars', key: 'event'),
  _NotificationTile(icon: Icons.person_outline, label: 'Profile updates', subtitle: 'Changes to your profile', key: 'profile_update'),
  _NotificationTile(icon: Icons.check_circle_outlined, label: 'Course completion', subtitle: 'When you finish a course', key: 'course_completion'),
  _NotificationTile(icon: Icons.workspace_premium_outlined, label: 'Certificate ready', subtitle: 'Your certificate is available', key: 'certificate_ready'),
  _NotificationTile(icon: Icons.message_outlined, label: 'Admin messages', subtitle: 'Messages from administrators', key: 'admin_message'),
  _NotificationTile(icon: Icons.help_outline, label: 'Q&A answers', subtitle: 'Replies to your questions', key: 'qna_answer'),
  _NotificationTile(icon: Icons.sms_outlined, label: 'SMS notifications', subtitle: 'Receive updates via SMS', key: 'sms'),
];

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends ConsumerState<NotificationSettingsScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, bool> _settings = {};
  Map<String, bool> _originalSettings = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  bool get _hasChanges {
    if (_settings.length != _originalSettings.length) return true;
    for (final entry in _settings.entries) {
      if (_originalSettings[entry.key] != entry.value) return true;
    }
    return false;
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get(ApiConfig.notificationSettings);
      final data = response.data as Map<String, dynamic>;
      final responseData = data['data'] as Map<String, dynamic>? ?? data;
      final defaults = {
        'email': true,
        'push': true,
        'new_lecture': true,
        'special_offer': true,
        'event': true,
        'profile_update': true,
        'course_completion': true,
        'certificate_ready': true,
        'admin_message': true,
        'qna_answer': true,
        'sms': false,
      };
      final loaded = <String, bool>{};
      for (final entry in defaults.entries) {
        loaded[entry.key] = responseData[entry.key] as bool? ?? entry.value;
      }
      setState(() {
        _settings = Map.from(loaded);
        _originalSettings = Map.from(loaded);
      });
    } catch (_) {
      setState(() {
        _settings = {
          'email': true,
          'push': true,
          'new_lecture': true,
          'special_offer': true,
          'event': true,
          'profile_update': true,
          'course_completion': true,
          'certificate_ready': true,
          'admin_message': true,
          'qna_answer': true,
          'sms': false,
        };
        _originalSettings = Map.from(_settings);
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      await _api.put(ApiConfig.notificationSettings, data: _settings);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification settings saved.')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final message = (e is DioException && e.response?.data is Map)
            ? ((e.response!.data as Map)['message'] as String? ?? 'Failed to save settings.')
            : 'Failed to save settings.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  void _toggle(String key) {
    setState(() {
      _settings[key] = !(_settings[key] ?? false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.only(bottom: 100),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          ...List.generate(_tiles.length, (index) {
                            return Padding(
                              padding: EdgeInsets.only(
                                left: 20,
                                right: 20,
                                bottom: index == _tiles.length - 1 ? 0 : 12,
                              ),
                              child: _buildToggleCard(_tiles[index]),
                            );
                          }),
                          if (_hasChanges) ...[
                            const SizedBox(height: 24),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: _buildSaveButton(),
                            ),
                          ],
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFE7E5ED),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFF0F172A)),
            ),
          ),
          const SizedBox(width: 14),
          Text(
            'Notification Settings',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleCard(_NotificationTile tile) {
    final value = _settings[tile.key] ?? false;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 15,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFFE7E5ED),
              shape: BoxShape.circle,
            ),
            child: Icon(tile.icon, size: 20, color: const Color(0xFF0F172A)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tile.label,
                  style: GoogleFonts.outfit(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  tile.subtitle,
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: _isSaving ? null : (_) => _toggle(tile.key),
            activeTrackColor: _authPrimary.withValues(alpha: 0.4),
            activeThumbColor: _authPrimary,
          ),
        ],
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            colors: [_authPrimary, _authPrimaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: _authPrimary.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: _isSaving ? null : _handleSave,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            disabledBackgroundColor: Colors.transparent,
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : Text(
                  'Save Changes',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
        ),
      ),
    );
  }
}