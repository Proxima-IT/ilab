import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/pagination_meta.dart';
import '../../../shared/services/api_client.dart';
import '../services/course_service.dart';

class CourseListState {
  final List<CourseModel> courses;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;
  final String? searchQuery;
  final String? selectedCategoryId;
  final String? selectedLevel;
  final String? selectedMode;
  final String priceFilter; // 'all', 'free', 'paid'
  final List<CourseCategory> categories;

  const CourseListState({
    this.courses = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
    this.searchQuery,
    this.selectedCategoryId,
    this.selectedLevel,
    this.selectedMode,
    this.priceFilter = 'all',
    this.categories = const [],
  });

  CourseListState copyWith({
    List<CourseModel>? courses,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
    String? searchQuery,
    String? selectedCategoryId,
    String? selectedLevel,
    String? selectedMode,
    String? priceFilter,
    List<CourseCategory>? categories,
  }) {
    return CourseListState(
      courses: courses ?? this.courses,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      selectedLevel: selectedLevel ?? this.selectedLevel,
      selectedMode: selectedMode ?? this.selectedMode,
      priceFilter: priceFilter ?? this.priceFilter,
      categories: categories ?? this.categories,
    );
  }
}

class CourseListNotifier extends StateNotifier<CourseListState> {
  final CourseService _service = CourseService();

  CourseListNotifier() : super(const CourseListState()) {
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _service.fetchCategories();
      state = state.copyWith(categories: categories);
    } catch (_) {}
  }

  List<CourseModel> _applyPriceFilter(List<CourseModel> items) {
    if (state.priceFilter == 'paid') {
      return items.where((c) => !c.isFree).toList();
    }
    return items;
  }

  Future<void> fetchCourses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.fetchCourses(
        page: 1,
        search: state.searchQuery,
        categoryId: state.selectedCategoryId,
        level: state.selectedLevel,
        mode: state.selectedMode,
        free: state.priceFilter == 'free' ? true : (state.priceFilter == 'paid' ? false : null),
      );
      state = CourseListState(
        courses: _applyPriceFilter(result.items),
        currentPage: 1,
        hasMore: result.meta.hasMore,
        searchQuery: state.searchQuery,
        selectedCategoryId: state.selectedCategoryId,
        selectedLevel: state.selectedLevel,
        selectedMode: state.selectedMode,
        priceFilter: state.priceFilter,
        categories: state.categories,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null, isLoadingMore: false);
    try {
      final result = await _service.fetchCourses(
        page: 1,
        search: state.searchQuery,
        categoryId: state.selectedCategoryId,
        level: state.selectedLevel,
        mode: state.selectedMode,
        free: state.priceFilter == 'free' ? true : (state.priceFilter == 'paid' ? false : null),
      );
      state = CourseListState(
        courses: _applyPriceFilter(result.items),
        currentPage: 1,
        hasMore: result.meta.hasMore,
        searchQuery: state.searchQuery,
        selectedCategoryId: state.selectedCategoryId,
        selectedLevel: state.selectedLevel,
        selectedMode: state.selectedMode,
        priceFilter: state.priceFilter,
        categories: state.categories,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: formatErrorMessage(e));
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true, error: null);
    try {
      final nextPage = state.currentPage + 1;
      final result = await _service.fetchCourses(
        page: nextPage,
        search: state.searchQuery,
        categoryId: state.selectedCategoryId,
        level: state.selectedLevel,
        mode: state.selectedMode,
        free: state.priceFilter == 'free' ? true : (state.priceFilter == 'paid' ? false : null),
      );
      state = CourseListState(
        courses: [...state.courses, ..._applyPriceFilter(result.items)],
        currentPage: nextPage,
        hasMore: result.meta.hasMore,
        searchQuery: state.searchQuery,
        selectedCategoryId: state.selectedCategoryId,
        selectedLevel: state.selectedLevel,
        selectedMode: state.selectedMode,
        priceFilter: state.priceFilter,
        categories: state.categories,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: formatErrorMessage(e));
    }
  }

  void setSearchQuery(String? query) {
    state = state.copyWith(searchQuery: query, currentPage: 1);
    fetchCourses();
  }

  void setCategoryId(String? categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId, currentPage: 1);
    fetchCourses();
  }

  void setLevel(String? level) {
    state = state.copyWith(selectedLevel: level, currentPage: 1);
    fetchCourses();
  }

  void setMode(String? mode) {
    state = state.copyWith(selectedMode: mode, currentPage: 1);
    fetchCourses();
  }

  void setPriceFilter(String filter) {
    state = state.copyWith(priceFilter: filter, currentPage: 1);
    fetchCourses();
  }

  void clearFilters() {
    state = CourseListState(categories: state.categories);
    fetchCourses();
  }
}

final courseListProvider = StateNotifierProvider<CourseListNotifier, CourseListState>((ref) {
  return CourseListNotifier();
});

class CourseDetailState {
  final CourseDetailModel? detail;
  final bool isLoading;
  final String? error;

  const CourseDetailState({this.detail, this.isLoading = false, this.error});

  CourseDetailState copyWith({CourseDetailModel? detail, bool? isLoading, String? error}) {
    return CourseDetailState(
      detail: detail ?? this.detail,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CourseDetailNotifier extends StateNotifier<CourseDetailState> {
  final CourseService _service = CourseService();

  CourseDetailNotifier(String slug) : super(const CourseDetailState(isLoading: true)) {
    fetchDetail(slug);
  }

  Future<void> fetchDetail(String slug) async {
    state = const CourseDetailState(isLoading: true);
    try {
      final detail = await _service.fetchCourseDetail(slug);
      state = CourseDetailState(detail: detail);
    } catch (e) {
      state = CourseDetailState(error: formatErrorMessage(e));
    }
  }
}

final courseDetailProvider = StateNotifierProvider.family<CourseDetailNotifier, CourseDetailState, String>((ref, slug) {
  return CourseDetailNotifier(slug);
});