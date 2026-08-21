import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/course_provider.dart';

class CourseListScreen extends ConsumerStatefulWidget {
  const CourseListScreen({super.key});

  @override
  ConsumerState<CourseListScreen> createState() => _CourseListScreenState();
}

class _CourseListScreenState extends ConsumerState<CourseListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  static const _filterChips = ['All', 'Free', 'Paid'];
  static const _levelChips = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

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

  Widget _buildFilterButton(CourseListState state) {
    final hasActiveLevel = state.selectedLevel != null;
    final hasActiveCategory = state.selectedCategoryId != null;
    final hasActiveFilters = state.priceFilter != 'all' || hasActiveLevel || hasActiveCategory;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: SizedBox(
        height: 36,
        child: GestureDetector(
          onTap: () => _showFilterBottomSheet(state),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: hasActiveFilters ? AppColors.primary : const Color(0xFFE7E5ED),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.filter_list_rounded,
                  size: 18,
                  color: hasActiveFilters ? Colors.white : const Color(0xFF0F172A),
                ),
                const SizedBox(width: 6),
                Text(
                  'Filter',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: hasActiveFilters ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                if (hasActiveFilters) ...[
                  const SizedBox(width: 6),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showFilterBottomSheet(CourseListState state) {
    String localPrice = state.priceFilter;
    String? localLevel = state.selectedLevel;
    String? localCategoryId = state.selectedCategoryId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.5,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Filter Courses',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                        ),
                        GestureDetector(
                          onTap: () {
                            localPrice = 'all';
                            localLevel = null;
                            localCategoryId = null;
                            setSheetState(() {});
                          },
                          child: Text(
                            'Clear All',
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildFilterSection(
                              title: 'Price',
                              chips: _filterChips,
                              activeChip: localPrice == 'all' ? 'All' : localPrice == 'free' ? 'Free' : 'Paid',
                              onChipTap: (chip) {
                                if (chip == 'All') {
                                  localPrice = 'all';
                                } else {
                                  localPrice = chip.toLowerCase();
                                }
                                setSheetState(() {});
                              },
                            ),
                            const SizedBox(height: 20),
                            _buildFilterSection(
                              title: 'Level',
                              chips: _levelChips,
                              activeChip: localLevel ?? 'All Levels',
                              onChipTap: (chip) {
                                if (chip == 'All Levels') {
                                  localLevel = null;
                                } else {
                                  localLevel = chip;
                                }
                                setSheetState(() {});
                              },
                            ),
                            const SizedBox(height: 20),
                            _buildFilterSection(
                              title: 'Category',
                              chips: ['All Categories', ...state.categories.map((c) => c.name)],
                              activeChip: localCategoryId == null
                                  ? 'All Categories'
                                  : state.categories.firstWhere((c) => c.id.toString() == localCategoryId).name,
                              onChipTap: (chip) {
                                if (chip == 'All Categories') {
                                  localCategoryId = null;
                                } else {
                                  final cat = state.categories.firstWhere((c) => c.name == chip);
                                  localCategoryId = cat.id.toString();
                                }
                                setSheetState(() {});
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          ref.read(courseListProvider.notifier).setPriceFilter(localPrice);
                          ref.read(courseListProvider.notifier).setLevel(localLevel);
                          ref.read(courseListProvider.notifier).setCategoryId(localCategoryId);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          elevation: 0,
                        ),
                        child: Text(
                          'Apply Filters',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildFilterSection({
    required String title,
    required List<String> chips,
    required String activeChip,
    required void Function(String) onChipTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: chips.map((chip) {
            final isActive = chip == activeChip;
            return GestureDetector(
              onTap: () => onChipTap(chip),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primary : const Color(0xFFE7E5ED),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  chip,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isActive ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(courseListProvider.notifier).refresh(),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(state)),
          SliverToBoxAdapter(child: _buildSearchBar(state)),
          SliverToBoxAdapter(child: _buildFilterButton(state)),
          _buildContent(state),
          if (state.isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary)),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildHeader(CourseListState state) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'All Courses',
            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
          ),
          const SizedBox(height: 4),
          Text(
            'Browse our course catalog',
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: const Color(0xFF475569)),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(CourseListState state) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: SizedBox(
        height: 48,
        child: TextField(
          controller: _searchController,
          onChanged: (value) => ref.read(courseListProvider.notifier).setSearchQuery(value.isEmpty ? null : value),
          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: 'Search courses...',
            hintStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: const Color(0xFF475569)),
            prefixIcon: const Padding(
              padding: EdgeInsets.only(left: 16, right: 8),
              child: Icon(Icons.search_rounded, size: 22, color: Color(0xFF0F172A)),
            ),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF0F172A)),
                    onPressed: () {
                      _searchController.clear();
                      ref.read(courseListProvider.notifier).setSearchQuery(null);
                    },
                  )
                : null,
            filled: true,
            fillColor: const Color(0xFFE7E5ED),
            contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(24),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(CourseListState state) {
    if (state.isLoading && state.courses.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: _CourseListShimmer(),
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
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.school_outlined, size: 64, color: const Color(0xFF475569).withValues(alpha: 0.4)),
                const SizedBox(height: 16),
                Text(
                  'No courses found',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Try adjusting your filters',
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: const Color(0xFF475569)),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (_, i) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildCourseCard(state.courses[i]),
          ),
          childCount: state.courses.length,
        ),
      ),
    );
  }

  Widget _buildCourseCard(CourseModel course) {
    return CourseCard(
      course: course,
      onView: () => Navigator.pushNamed(context, '/course-detail', arguments: course.slug),
      onEnroll: () => Navigator.pushNamed(context, '/course-detail', arguments: course.slug),
    );
  }
}

class _CourseListShimmer extends StatelessWidget {
  const _CourseListShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ShimmerBlock(height: 28, width: 180),
                SizedBox(height: 6),
                _ShimmerBlock(height: 16, width: 220),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: _ShimmerBlock(height: 48, borderRadius: 24),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const _ShimmerBlock(height: 36, width: 64, borderRadius: 20),
                const SizedBox(width: 12),
                const _ShimmerBlock(height: 36, width: 56, borderRadius: 20),
                const SizedBox(width: 12),
                const _ShimmerBlock(height: 36, width: 52, borderRadius: 20),
                const SizedBox(width: 12),
                const _ShimmerBlock(height: 36, width: 80, borderRadius: 20),
                const SizedBox(width: 12),
                const _ShimmerBlock(height: 36, width: 96, borderRadius: 20),
              ],
            ),
          ),
          const SizedBox(height: 20),
          for (int i = 0; i < 4; i++) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: _ShimmerBlock(height: 180, borderRadius: 24),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShimmerBlock extends StatelessWidget {
  final double height;
  final double? width;
  final double borderRadius;

  const _ShimmerBlock({this.height = 120, this.width, this.borderRadius = 14});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE7E5ED),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}