import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class BBCodeRenderer extends StatelessWidget {
  final String content;

  const BBCodeRenderer({super.key, required this.content});

  @override
  Widget build(BuildContext context) {
    final blocks = content
        .split(RegExp(r'\n{2,}'))
        .map((b) => b.trim())
        .where((b) => b.isNotEmpty)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(blocks.length, (i) {
        return _buildBlock(blocks[i], i);
      }),
    );
  }

  String? _tagContent(String block, String tag) {
    final regex = RegExp('^\\[$tag\\]([\\s\\S]*?)\\[/$tag\\]\$', caseSensitive: false);
    final match = regex.firstMatch(block);
    return match?.group(1)?.trim();
  }

  List<String> _listItems(String content) {
    final matches = RegExp(r'\[li\]([\s\S]*?)\[/li\]', caseSensitive: false)
        .allMatches(content)
        .map((m) => m.group(1)!.trim())
        .toList();

    if (matches.isNotEmpty) return matches;

    return content
        .split(RegExp(r'\r?\n'))
        .map((line) => line.replaceFirst(RegExp(r'^[-*]\s*'), '').trim())
        .where((line) => line.isNotEmpty)
        .toList();
  }

  List<InlineSpan> _parseInline(String text, String keyPrefix) {
    final pattern = RegExp(
      r'\[(b|i|u)\](.*?)\[\/\1\]|\[link=([^\]]+)\](.*?)\[\/link\]',
      caseSensitive: false,
      dotAll: true,
    );

    final spans = <InlineSpan>[];
    int lastIndex = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastIndex) {
        spans.add(TextSpan(text: text.substring(lastIndex, match.start)));
      }

      final tag = match.group(1)?.toLowerCase();
      final innerContent = match.group(2);
      final url = match.group(3);
      final label = match.group(4);

      if (tag == 'b') {
        spans.add(TextSpan(
          text: innerContent,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
        ));
      } else if (tag == 'i') {
        spans.add(TextSpan(
          text: innerContent,
          style: GoogleFonts.outfit(fontStyle: FontStyle.italic),
        ));
      } else if (tag == 'u') {
        spans.add(TextSpan(
          text: innerContent,
          style: GoogleFonts.outfit(decoration: TextDecoration.underline, decorationColor: AppColors.foreground),
        ));
      } else if (url != null && label != null) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: GestureDetector(
            onTap: () {},
            child: Text(
              label,
              style: GoogleFonts.outfit(
                color: AppColors.primaryDark,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
                decorationColor: AppColors.primaryDark,
              ),
            ),
          ),
        ));
      }

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      spans.add(TextSpan(text: text.substring(lastIndex)));
    }

    return spans;
  }

  Widget _buildInlineText(String text, {TextStyle? style}) {
    final spans = _parseInline(text, '');
    if (spans.isEmpty) return const SizedBox.shrink();

    return RichText(
      text: TextSpan(
        style: style,
        children: spans,
      ),
    );
  }

  Widget _buildTable(String content, int index) {
    final rows = RegExp(r'\[tr\]([\s\S]*?)\[/tr\]', caseSensitive: false)
        .allMatches(content)
        .map((m) => m.group(1)!)
        .toList();

    return Padding(
      key: ValueKey('blog-table-$index'),
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Table(
            border: TableBorder.symmetric(
              inside: BorderSide(color: AppColors.border),
            ),
            columnWidths: null,
            defaultColumnWidth: const IntrinsicColumnWidth(),
            children: List.generate(rows.length, (rowIndex) {
              final headers = RegExp(r'\[th\]([\s\S]*?)\[/th\]', caseSensitive: false)
                  .allMatches(rows[rowIndex])
                  .map((m) => m.group(1)!.trim())
                  .toList();
              final cells = RegExp(r'\[td\]([\s\S]*?)\[/td\]', caseSensitive: false)
                  .allMatches(rows[rowIndex])
                  .map((m) => m.group(1)!.trim())
                  .toList();
              final values = headers.isNotEmpty ? headers : cells;
              final isHeader = headers.isNotEmpty;

              return TableRow(
                decoration: BoxDecoration(
                  color: isHeader ? AppColors.surface : null,
                ),
                children: List.generate(values.length, (cellIndex) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: _buildInlineText(
                      values[cellIndex],
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: isHeader ? FontWeight.w700 : FontWeight.w400,
                        color: isHeader ? AppColors.foreground : AppColors.foreground.withValues(alpha: 0.85),
                      ),
                    ),
                  );
                }),
              );
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildBlock(String block, int index) {
    final key = ValueKey('blog-block-$index');

    final h1 = _tagContent(block, 'h1');
    if (h1 != null) {
      return Padding(
        key: key,
        padding: const EdgeInsets.only(top: 32, bottom: 12),
        child: _buildInlineText(
          h1,
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            height: 1.2,
            color: AppColors.foreground,
          ),
        ),
      );
    }

    final h2 = _tagContent(block, 'h2');
    if (h2 != null) {
      return Padding(
        key: key,
        padding: const EdgeInsets.only(top: 28, bottom: 10),
        child: _buildInlineText(
          h2,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            height: 1.3,
            color: AppColors.foreground,
          ),
        ),
      );
    }

    final h3 = _tagContent(block, 'h3');
    if (h3 != null) {
      return Padding(
        key: key,
        padding: const EdgeInsets.only(top: 24, bottom: 8),
        child: _buildInlineText(
          h3,
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            height: 1.3,
            color: AppColors.foreground,
          ),
        ),
      );
    }

    final big = _tagContent(block, 'big');
    if (big != null) {
      return Padding(
        key: key,
        padding: const EdgeInsets.only(top: 0),
        child: _buildInlineText(
          big,
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            height: 1.5,
            color: AppColors.foreground,
          ),
        ),
      );
    }

    final quote = _tagContent(block, 'quote');
    if (quote != null) {
      return Padding(
        key: key,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.05),
            border: Border(
              left: BorderSide(
                color: AppColors.accent,
                width: 4,
              ),
            ),
          ),
          child: _buildInlineText(
            quote,
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              height: 1.6,
              color: AppColors.foreground.withValues(alpha: 0.85),
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      );
    }

    final ul = _tagContent(block, 'ul');
    if (ul != null) {
      final items = _listItems(ul);
      return Padding(
        key: key,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(items.length, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 8, right: 10),
                    child: Text(
                      '\u2022',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        color: AppColors.foreground,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _buildInlineText(
                      items[i],
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        height: 1.6,
                        color: AppColors.foreground,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      );
    }

    final ol = _tagContent(block, 'ol');
    if (ol != null) {
      final items = _listItems(ol);
      return Padding(
        key: key,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(items.length, (i) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 8, right: 10),
                    child: Text(
                      '${i + 1}.',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _buildInlineText(
                      items[i],
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        height: 1.6,
                        color: AppColors.foreground,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      );
    }

    final table = _tagContent(block, 'table');
    if (table != null) {
      return _buildTable(table, index);
    }

    return Padding(
      key: key,
      padding: const EdgeInsets.only(bottom: 16),
      child: _buildInlineText(
        block,
        style: GoogleFonts.outfit(
          fontSize: 16,
          height: 1.7,
          color: AppColors.foreground,
        ),
      ),
    );
  }
}