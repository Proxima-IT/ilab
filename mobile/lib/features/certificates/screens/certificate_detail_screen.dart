import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../../shared/models/certificate_model.dart';
import '../../../shared/theme/app_colors.dart';

class CertificateDetailScreen extends StatefulWidget {
  final CertificateModel certificate;

  const CertificateDetailScreen({super.key, required this.certificate});

  @override
  State<CertificateDetailScreen> createState() => _CertificateDetailScreenState();
}

class _CertificateDetailScreenState extends State<CertificateDetailScreen> {
  final GlobalKey _repaintKey = GlobalKey();
  bool _isDownloadingPdf = false;
  bool _isDownloadingJpg = false;

  static const _channel = MethodChannel('com.ilab.ilab_app/file_saver');

  Future<String> _saveFile({
    required String filename,
    required String extension,
    required Uint8List bytes,
    required String mimeType,
  }) async {
    final path = await _channel.invokeMethod<String>('saveFile', {
      'filename': filename,
      'extension': extension,
      'bytes': bytes,
      'mimeType': mimeType,
    });
    return path ?? 'Unknown';
  }

  String get _studentName => widget.certificate.userName ?? 'Student';
  String get _courseName => widget.certificate.courseName ?? 'Course';
  String get _signatoryName =>
      widget.certificate.authorizedSignatoryName ?? 'iLab Authorities';
  String get _signatoryTitle =>
      widget.certificate.authorizedSignatoryTitle ?? 'iLab';
  String get _code => widget.certificate.verificationCode ?? 'N/A';
  String get _instructorName =>
      widget.certificate.courseInstructorName ?? 'N/A';

  String get _formattedDate {
    if (widget.certificate.issuedAt == null) return '';
    try {
      return DateFormat('MMMM d, yyyy').format(
        DateTime.parse(widget.certificate.issuedAt!),
      );
    } catch (_) {
      return widget.certificate.issuedAt!;
    }
  }

  String get _filename => '${_studentName}_${widget.certificate.id}';

  Future<void> _downloadPdf() async {
    setState(() => _isDownloadingPdf = true);
    try {
      final outfitData = await rootBundle.load('assets/fonts/Outfit.ttf');
      final outfitFont = pw.Font.ttf(outfitData);

      final bengaliData = await rootBundle.load('assets/fonts/HindSiliguri-Regular.ttf');
      final bengaliFont = pw.Font.ttf(bengaliData);

      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.letter.landscape,
          margin: const pw.EdgeInsets.all(0),
          build: (pw.Context context) {
            return _buildPdfContent(
              outfitFont: outfitFont,
              bengaliFont: bengaliFont,
            );
          },
        ),
      );

      final pdfBytes = await pdf.save();
      debugPrint('📥 PDF Download START: ${DateTime.now()}');
      debugPrint('📥 Filename: $_filename');
      debugPrint('📥 PDF bytes size: ${pdfBytes.length}');

      final savePath = await _saveFile(
        filename: _filename,
        extension: 'pdf',
        bytes: Uint8List.fromList(pdfBytes),
        mimeType: 'application/pdf',
      );
      debugPrint('📥 Save location: $savePath');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Certificate saved to $savePath')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF download failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloadingPdf = false);
    }
  }

  Future<void> _downloadJpg() async {
    setState(() => _isDownloadingJpg = true);
    try {
      final boundary = _repaintKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('Could not capture certificate');

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) throw Exception('Could not encode image');

      final imageBytes = byteData.buffer.asUint8List();
      debugPrint('📥 JPG Download START: ${DateTime.now()}');
      debugPrint('📥 Filename: $_filename');
      debugPrint('📥 JPG bytes size: ${imageBytes.length}');

      final savePath = await _saveFile(
        filename: _filename,
        extension: 'jpg',
        bytes: imageBytes,
        mimeType: 'image/jpeg',
      );
      debugPrint('📥 Save location: $savePath');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Certificate saved to $savePath')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('JPG download failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloadingJpg = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Certificate',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF0F172A),
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: Color(0xFF0F172A)),
            onPressed: _downloadJpg,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            RepaintBoundary(
              key: _repaintKey,
              child: _buildCertificateWidget(),
            ),
            const SizedBox(height: 24),
            _buildActionButtons(),
            const SizedBox(height: 24),
            _buildInfoSection(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildCertificateWidget() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 600),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.10),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: AppColors.primaryDark.withValues(alpha: 0.25),
            width: 3,
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: const Color(0xFFD6B45C),
              width: 2,
            ),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              _buildGoldDivider(),
              const SizedBox(height: 12),
              _buildSealIcon(),
              const SizedBox(height: 12),
              Text(
                'Certificate of Completion',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'VERIFIED CREDENTIAL BY ILAB',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 3,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'This certificate is proudly awarded to',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  color: const Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _studentName,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 8),
              _buildGoldLine(),
              const SizedBox(height: 16),
              Text(
                'for successfully completing the course',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  color: const Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _courseName,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Issued on $_formattedDate',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: const Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          _signatoryName,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Container(
                          width: 120,
                          height: 2,
                          color: const Color(0xFF0F172A),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _signatoryTitle,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: const Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_instructorName != 'N/A')
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            'Instructor',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF475569),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _instructorName,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(
                      'Verification Code',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF475569),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _code,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'This credential can be verified using the certificate code above.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 8),
              _buildGoldDivider(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGoldDivider() {
    return Container(
      height: 2,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFA16207), Color(0xFFFACC15), Color(0xFFA16207)],
        ),
        borderRadius: BorderRadius.circular(1),
      ),
    );
  }

  Widget _buildGoldLine() {
    return Container(
      height: 3,
      width: 240,
      decoration: BoxDecoration(
        color: const Color(0xFFD6B45C),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildSealIcon() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        gradient: const RadialGradient(
          colors: [Color(0xFF14B8A6), Color(0xFF0F766E)],
        ),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: const Icon(
        Icons.verified_rounded,
        color: Colors.white,
        size: 30,
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: _buildDownloadButton(
            label: 'Download PDF',
            icon: Icons.picture_as_pdf_rounded,
            isLoading: _isDownloadingPdf,
            onPressed: _isDownloadingPdf ? null : _downloadPdf,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildDownloadButton(
            label: 'Download JPG',
            icon: Icons.image_rounded,
            isLoading: _isDownloadingJpg,
            onPressed: _isDownloadingJpg ? null : _downloadJpg,
          ),
        ),
      ],
    );
  }

  Widget _buildDownloadButton({
    required String label,
    required IconData icon,
    required bool isLoading,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      height: 48,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Certificate Details',
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow('Course', _courseName),
          _buildInfoRow('Student', _studentName),
          _buildInfoRow('Issue Date', _formattedDate),
          _buildInfoRow('Verification Code', _code),
          _buildInfoRow('Authorized Signatory', _signatoryName),
          _buildInfoRow('Signatory Title', _signatoryTitle),
          if (_instructorName != 'N/A')
            _buildInfoRow('Instructor', _instructorName),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _buildPdfContent({
    required pw.Font outfitFont,
    required pw.Font bengaliFont,
  }) {
    return pw.Theme(
      data: pw.ThemeData.withFont(
        base: outfitFont,
        bold: outfitFont,
        fontFallback: [bengaliFont],
      ),
      child: pw.Container(
        width: double.infinity,
        height: double.infinity,
        decoration: pw.BoxDecoration(
          color: PdfColors.white,
        ),
        child: pw.Stack(
          children: [
            pw.Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: pw.Container(
                height: 80,
                decoration: const pw.BoxDecoration(
                  gradient: pw.LinearGradient(
                    colors: [
                      PdfColor.fromInt(0x0F766E),
                      PdfColor.fromInt(0x0F766E),
                    ],
                    stops: [0.0, 1.0],
                  ),
                ),
              ),
            ),
            pw.Center(
              child: pw.Container(
                width: 700,
                height: 440,
                decoration: pw.BoxDecoration(
                  color: PdfColors.white,
                  border: pw.Border.all(
                    color: PdfColor.fromInt(0x0F766E),
                    width: 3,
                  ),
                  borderRadius: const pw.BorderRadius.all(
                    pw.Radius.circular(18),
                  ),
                ),
                child: pw.Container(
                  margin: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(
                      color: PdfColor.fromInt(0xD6B45C),
                      width: 2,
                    ),
                    borderRadius: const pw.BorderRadius.all(
                      pw.Radius.circular(12),
                    ),
                  ),
                  padding: const pw.EdgeInsets.all(20),
                  child: pw.Column(
                    mainAxisAlignment: pw.MainAxisAlignment.center,
                    children: [
                      pw.Container(
                        height: 2,
                        decoration: const pw.BoxDecoration(
                          gradient: pw.LinearGradient(
                            colors: [
                              PdfColor.fromInt(0xA16207),
                              PdfColor.fromInt(0xFACC15),
                              PdfColor.fromInt(0xA16207),
                            ],
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 10),
                      pw.Container(
                        width: 40,
                        height: 40,
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromInt(0x0F766E),
                          shape: pw.BoxShape.circle,
                        ),
                        child: pw.Center(
                          child: pw.Text(
                            '✓',
                            style: pw.TextStyle(
                              color: PdfColors.white,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 10),
                      pw.Text(
                        'Certificate of Completion',
                        style: pw.TextStyle(
                          fontSize: 24,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromInt(0x0F172A),
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'VERIFIED CREDENTIAL BY ILAB',
                        style: pw.TextStyle(
                          fontSize: 9,
                          letterSpacing: 3,
                          color: PdfColor.fromInt(0x0F766E),
                        ),
                      ),
                      pw.SizedBox(height: 14),
                      pw.Text(
                        'This certificate is proudly awarded to',
                        style: pw.TextStyle(
                          fontSize: 13,
                          color: PdfColor.fromInt(0x475569),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        _studentName,
                        style: pw.TextStyle(
                          fontSize: 32,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromInt(0x111827),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Container(
                        height: 2,
                        width: 180,
                        color: PdfColor.fromInt(0xD6B45C),
                      ),
                      pw.SizedBox(height: 12),
                      pw.Text(
                        'for successfully completing the course',
                        style: pw.TextStyle(
                          fontSize: 13,
                          color: PdfColor.fromInt(0x475569),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        _courseName,
                        style: pw.TextStyle(
                          fontSize: 20,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromInt(0x0F766E),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Issued on $_formattedDate',
                        style: pw.TextStyle(
                          fontSize: 12,
                          color: PdfColor.fromInt(0x475569),
                        ),
                      ),
                      pw.SizedBox(height: 16),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.center,
                        children: [
                          pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.center,
                            children: [
                              pw.Text(
                                _signatoryName,
                                style: pw.TextStyle(
                                  fontSize: 14,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromInt(0x0F172A),
                                ),
                              ),
                              pw.Container(
                                width: 100,
                                height: 1,
                                color: PdfColor.fromInt(0x0F172A),
                              ),
                              pw.SizedBox(height: 2),
                              pw.Text(
                                _signatoryTitle,
                                style: pw.TextStyle(
                                  fontSize: 10,
                                  color: PdfColor.fromInt(0x475569),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 14),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromInt(0x0F0D9488),
                        ),
                        child: pw.Column(
                          children: [
                            pw.Text(
                              'Verification Code',
                              style: pw.TextStyle(
                                fontSize: 9,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColor.fromInt(0x475569),
                              ),
                            ),
                            pw.SizedBox(height: 2),
                            pw.Text(
                              _code,
                              style: pw.TextStyle(
                                fontSize: 14,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColor.fromInt(0x0F172A),
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        'This credential can be verified using the certificate code above.',
                        style: pw.TextStyle(
                          fontSize: 8,
                          color: PdfColor.fromInt(0x64748B),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Container(
                        height: 2,
                        decoration: const pw.BoxDecoration(
                          gradient: pw.LinearGradient(
                            colors: [
                              PdfColor.fromInt(0xA16207),
                              PdfColor.fromInt(0xFACC15),
                              PdfColor.fromInt(0xA16207),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}