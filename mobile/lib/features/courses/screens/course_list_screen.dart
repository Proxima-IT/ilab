import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/course_provider.dart';
import '../services/course_service.dart';

class CourseListScreen extends ConsumerStatefulWidget {
  const CourseListScreen({super.key});

  @override
  ConsumerState<CourseListScreen> createState() => _CourseListScreenState();
}

class _CourseListScreenState extends ConsumerState<CourseListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(courseListProvider.notifier).fetchCourses());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(courseListProvider.notifier).loadMore();
    }
  }

  static const _levels = ['Beginner', 'Intermediate', 'Advanced'];
  static const _modes = ['Self-paced', 'Live'];

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(courseListProvider.notifier).refresh(),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(state)),
          SliverToBoxAdapter(child: _buildFilters(state)),
          _buildContent(state),
        ],
      ),
    );
  }

  Widget _buildHeader(CourseListState state) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8, right: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'All Courses',
            style: AppTextStyles.titleLarge.copyWith(color: AppColors.foreground),
          ),
          const SizedBox(height: 4),
          Text(
            'Browse our course catalog',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: TextField(
              controller: _searchController,
              onChanged: (value) => ref.read(courseListProvider.notifier).setSearchQuery(value.isEmpty ? null : value),
              style: AppTextStyles.bodyMedium,
              decoration: InputDecoration(
                hintText: 'Search courses...',
                hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
                prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.mutedForeground),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(courseListProvider.notifier).setSearchQuery(null);
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.muted,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(CourseListState state) {
    final hasActiveFilters = state.priceFilter != 'all' ||
        state.selectedCategoryId != null ||
        state.selectedLevel != null ||
        state.selectedMode != null;

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 4, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: _buildDropdown(
                value: state.selectedCategoryId,
                hint: 'All Categories',
                items: [
                  DropdownMenuItem(value: null, child: Text('All Categories', style: AppTextStyles.labelSmall)),
                  ...state.categories.map((cat) => DropdownMenuItem(
                    value: cat.id.toString(),
                    child: Text(cat.name, style: AppTextStyles.labelSmall),
                  )),
                ],
                onChanged: (v) => ref.read(courseListProvider.notifier).setCategoryId(v),
              )),
              const SizedBox(width: 8),
              Expanded(child: _buildDropdown(
                value: state.selectedLevel,
                hint: 'All Levels',
                items: [
                  DropdownMenuItem(value: null, child: Text('All Levels', style: AppTextStyles.labelSmall)),
                  ..._levels.map((level) => DropdownMenuItem(
                    value: level,
                    child: Text(level, style: AppTextStyles.labelSmall),
                  )),
                ],
                onChanged: (v) => ref.read(courseListProvider.notifier).setLevel(v),
              )),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _buildDropdown(
                value: state.selectedMode,
                hint: 'All Modes',
                items: [
                  DropdownMenuItem(value: null, child: Text('All Modes', style: AppTextStyles.labelSmall)),
                  ..._modes.map((mode) => DropdownMenuItem(
                    value: mode,
                    child: Text(mode, style: AppTextStyles.labelSmall),
                  )),
                ],
                onChanged: (v) => ref.read(courseListProvider.notifier).setMode(v),
              )),
              const SizedBox(width: 8),
              Expanded(child: _buildDropdown(
                value: state.priceFilter,
                hint: 'Price',
                items: [
                  DropdownMenuItem(value: 'all', child: Text('All', style: AppTextStyles.labelSmall)),
                  DropdownMenuItem(value: 'free', child: Text('Free', style: AppTextStyles.labelSmall)),
                  DropdownMenuItem(value: 'paid', child: Text('Paid', style: AppTextStyles.labelSmall)),
                ],
                onChanged: (v) => ref.read(courseListProvider.notifier).setPriceFilter(v ?? 'all'),
              )),
            ],
          ),
          if (hasActiveFilters)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: GestureDetector(
                onTap: () => ref.read(courseListProvider.notifier).clearFilters(),
                child: Text(
                  'Clear Filters',
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required String hint,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
        color: AppColors.background,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          hint: Text(hint, style: AppTextStyles.labelSmall.copyWith(color: AppColors.mutedForeground)),
          style: AppTextStyles.labelSmall.copyWith(color: AppColors.foreground, fontWeight: FontWeight.w600),
          icon: const Icon(Icons.keyboard_arrow_down, size: 18, color: AppColors.mutedForeground),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildContent(CourseListState state) {
    if (state.isLoading && state.courses.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: ShimmerGrid(),
      );
    }
    if (state.error != null && state.courses.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: ErrorDisplayWidget(
          message: state.error!,
          onRetry: () => ref.read(courseListProvider.notifier).fetchCourses(),
        ),
      );
    }
    if (state.courses.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: EmptyStateWidget(
          icon: Icons.school_outlined,
          title: 'No courses found',
          subtitle: 'Try adjusting your filters.',
        ),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.75,
        ),
        delegate: SliverChildBuilderDelegate(
          (_, i) => CourseCard(
            course: state.courses[i],
            onTap: () => Navigator.pushNamed(context, '/course-detail', arguments: state.courses[i].slug),
          ),
          childCount: state.courses.length,
        ),
      ),
    );
  }
}