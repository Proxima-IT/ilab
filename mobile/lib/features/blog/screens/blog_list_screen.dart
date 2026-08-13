import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/blog_card.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/blog_provider.dart';

class BlogListScreen extends ConsumerStatefulWidget {
  const BlogListScreen({super.key});

  @override
  ConsumerState<BlogListScreen> createState() => _BlogListScreenState();
}

class _BlogListScreenState extends ConsumerState<BlogListScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(blogListProvider.notifier).fetchPosts());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(blogListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(blogListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(blogListProvider.notifier).refresh(),
      child: _buildBody(state),
    );
  }

  Widget _buildBody(BlogListState state) {
    if (state.isLoading && state.posts.isEmpty) {
      return const _BlogShimmerList();
    }
    if (state.error != null && state.posts.isEmpty) {
      return ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(blogListProvider.notifier).fetchPosts(),
      );
    }
    if (state.posts.isEmpty) {
      return const EmptyStateWidget(
        icon: Icons.article_outlined,
        title: 'No blog posts yet',
        subtitle: 'Check back later for new articles.',
      );
    }
    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Text(
                  'Our Blog',
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Read our latest articles',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: BlogCard(
                  post: state.posts[i],
                  onTap: () => Navigator.pushNamed(context, '/blog-detail', arguments: state.posts[i].slug),
                ),
              ),
              childCount: state.posts.length,
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: _buildFooter(state),
        ),
      ],
    );
  }

  Widget _buildFooter(BlogListState state) {
    if (state.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (!state.hasMore && state.posts.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No more posts',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
          ),
        ),
      );
    }
    if (state.error != null && state.posts.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: TextButton.icon(
            onPressed: () => ref.read(blogListProvider.notifier).loadMore(),
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

class _BlogShimmerList extends StatelessWidget {
  const _BlogShimmerList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      children: List.generate(
        3,
        (index) => Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(24),
            ),
            clipBehavior: Clip.antiAlias,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 160,
                  child: ColoredBox(color: Color(0xFFF1F5F9)),
                ),
                Padding(
                  padding: EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 16,
                        width: 200,
                        child: ColoredBox(color: Color(0xFFF1F5F9)),
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          CircleAvatar(radius: 12, backgroundColor: Color(0xFFF1F5F9)),
                          SizedBox(width: 6),
                          SizedBox(
                            height: 12,
                            width: 80,
                            child: ColoredBox(color: Color(0xFFF1F5F9)),
                          ),
                          Spacer(),
                          SizedBox(
                            height: 12,
                            width: 60,
                            child: ColoredBox(color: Color(0xFFF1F5F9)),
                          ),
                        ],
                      ),
                      SizedBox(height: 8),
                      SizedBox(
                        height: 14,
                        width: double.infinity,
                        child: ColoredBox(color: Color(0xFFF1F5F9)),
                      ),
                      SizedBox(height: 4),
                      SizedBox(
                        height: 14,
                        width: 160,
                        child: ColoredBox(color: Color(0xFFF1F5F9)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}