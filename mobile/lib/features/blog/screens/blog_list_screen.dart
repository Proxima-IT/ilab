import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/widgets/blog_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/blog_provider.dart';

class BlogListScreen extends ConsumerStatefulWidget {
  const BlogListScreen({super.key});

  @override
  ConsumerState<BlogListScreen> createState() => _BlogListScreenState();
}

class _BlogListScreenState extends ConsumerState<BlogListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(blogListProvider.notifier).fetchPosts());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(blogListProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(blogListProvider.notifier).fetchPosts(),
      child: _buildBody(state),
    );
  }

  Widget _buildBody(BlogListState state) {
    if (state.isLoading && state.posts.isEmpty) {
      return const ShimmerList();
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
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, top: 12, bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Our Blog',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Read our latest articles',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: BlogCard(
                  post: state.posts[i],
                  onTap: () => Navigator.pushNamed(context, '/blog-detail', arguments: state.posts[i].slug),
                ),
              ),
              childCount: state.posts.length,
            ),
          ),
        ),
      ],
    );
  }
}