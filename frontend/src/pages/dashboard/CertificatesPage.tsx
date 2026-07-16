import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, FileImage, FileText, Lock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudent } from "@/hooks/useStudentData";
import ilabLogo from "@/assets/ilab_logo.jpeg";
import {
  certificateService,
  type StudentCertificate,
} from "@/services/student/certificate.service";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const CERT_WIDTH = 1400;
const CERT_HEIGHT = 990;
const LOGO_TOKEN = "__ILAB_LOGO__";

function escapeXml(value?: string | null): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date?: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function certificateSvg(certificate: StudentCertificate): string {
  const studentName = escapeXml(certificate.user?.name || "Student");
  const courseName = escapeXml(certificate.course?.title || "Course");
  const issuedDate = escapeXml(formatDate(certificate.issued_at));
  const code = escapeXml(certificate.verification_code);
  const signatoryName = escapeXml(certificate.authorized_signatory_name || "iLab Authorities");
  const signatoryTitle = escapeXml(certificate.authorized_signatory_title || "iLab");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${CERT_WIDTH}" height="${CERT_HEIGHT}" viewBox="0 0 ${CERT_WIDTH} ${CERT_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbfffd"/>
      <stop offset="52%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eef8f5"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a16207"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>
    <radialGradient id="seal" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f766e" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="1400" height="990" fill="url(#bg)"/>
  <path d="M0 0H1400V120C1110 70 940 168 700 118C460 68 230 40 0 112V0Z" fill="#0f766e" opacity="0.08"/>
  <path d="M1400 990H0V848C235 930 445 810 700 874C955 938 1155 898 1400 822V990Z" fill="#0f766e" opacity="0.08"/>
  <rect x="55" y="55" width="1290" height="880" rx="30" fill="#ffffff" opacity="0.88" filter="url(#softShadow)"/>
  <rect x="55" y="55" width="1290" height="880" rx="30" fill="none" stroke="#0f766e" stroke-width="5"/>
  <rect x="82" y="82" width="1236" height="826" rx="22" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <line x1="150" y1="136" x2="550" y2="136" stroke="#d6b45c" stroke-width="2"/>
  <line x1="850" y1="136" x2="1250" y2="136" stroke="#d6b45c" stroke-width="2"/>
  <image href="${LOGO_TOKEN}" x="620" y="102" width="160" height="86" preserveAspectRatio="xMidYMid meet"/>
  <text x="700" y="258" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#0f172a">Certificate of Completion</text>
  <text x="700" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="5" fill="#0f766e">VERIFIED CREDENTIAL BY ILAB</text>
  <text x="700" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#475569">This certificate is proudly awarded to</text>
  <text x="700" y="492" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#111827">${studentName}</text>
  <path d="M360 528C465 548 571 506 700 528C827 550 934 508 1040 528" fill="none" stroke="#d6b45c" stroke-width="3"/>
  <text x="700" y="590" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" fill="#475569">for successfully completing the course</text>
  <text x="700" y="666" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="700" fill="#0f766e">${courseName}</text>
  <text x="700" y="725" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#475569">Issued on ${issuedDate}</text>
  <g transform="translate(156 784)">
    <text x="92" y="36" text-anchor="middle" font-family="'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive" font-size="38" fill="#0f172a">${signatoryName}</text>
    <line x1="0" y1="58" x2="230" y2="58" stroke="#0f172a" stroke-width="2"/>
    <text x="115" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#475569">${signatoryTitle}</text>
  </g>
  <g transform="translate(955 800)">
    <text x="185" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">Verification Code</text>
    <text x="185" y="42" text-anchor="middle" font-family="Courier New, monospace" font-size="21" font-weight="700" fill="#0f172a">${code}</text>
  </g>
  <text x="700" y="932" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">This credential can be verified using the certificate code above.</text>
</svg>`;
}

function certificateSvgForPreview(certificate: StudentCertificate): string {
  return certificateSvg(certificate).split(LOGO_TOKEN).join(ilabLogo);
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Logo load failed.");

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function certificateSvgForDownload(certificate: StudentCertificate): Promise<string> {
  const logoDataUrl = await imageUrlToDataUrl(ilabLogo);
  return certificateSvg(certificate).split(LOGO_TOKEN).join(logoDataUrl);
}

async function svgToJpegDataUrl(svg: string): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = CERT_WIDTH;
    canvas.height = CERT_HEIGHT;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas not supported.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);
    context.drawImage(image, 0, 0, CERT_WIDTH, CERT_HEIGHT);

    return canvas.toDataURL("image/jpeg", 0.95);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function jpegDataUrlToPdf(dataUrl: string): Blob {
  const binary = atob(dataUrl.split(",")[1] || "");
  const imageBytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const encoder = new TextEncoder();
  const objects: BlobPart[] = [];

  const add = (text: string) => {
    const bytes = encoder.encode(text);
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    objects.push(copy.buffer);
  };
  const offsets: number[] = [];
  let length = 0;

  const pushObject = (textBeforeStream: string, stream?: Uint8Array, textAfterStream = "") => {
    offsets.push(length);
    add(textBeforeStream);
    length += encoder.encode(textBeforeStream).length;
    if (stream) {
      const copy = new Uint8Array(stream.length);
      copy.set(stream);
      objects.push(copy.buffer);
      length += stream.length;
    }
    if (textAfterStream) {
      add(textAfterStream);
      length += encoder.encode(textAfterStream).length;
    }
  };

  const header = "%PDF-1.4\n";
  add(header);
  length += encoder.encode(header).length;

  pushObject("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  pushObject("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  pushObject("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
  pushObject(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${CERT_WIDTH} /Height ${CERT_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`, imageBytes, "\nendstream\nendobj\n");
  const content = "q\n842 0 0 595 0 0 cm\n/Im0 Do\nQ\n";
  pushObject(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefOffset = length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  objects.push(encoder.encode(xref));

  return new Blob(objects, { type: "application/pdf" });
}

export default function CertificatesPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading: studentLoading } = useStudent();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadCertificates() {
      setLoading(true);

      try {
        const data = await certificateService.getCertificates();

        if (mounted) {
          setCertificates(data.certificates);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadCertificates();

    return () => {
      mounted = false;
    };
  }, []);

  const certificateCourseIds = useMemo(
    () => new Set(certificates.map((certificate) => String(certificate.course?.id))),
    [certificates]
  );
  const inProgress = enrolledCoursesList.filter(
    (course) => !certificateCourseIds.has(String(course.course.id))
  );

  const downloadJpg = async (certificate: StudentCertificate) => {
    try {
      const svg = await certificateSvgForDownload(certificate);
      const jpeg = await svgToJpegDataUrl(svg);
      downloadDataUrl(jpeg, `${certificate.verification_code}.jpg`);
    } catch {
      toast.error("JPG download failed.");
    }
  };

  const downloadPdf = async (certificate: StudentCertificate) => {
    try {
      const svg = await certificateSvgForDownload(certificate);
      const jpeg = await svgToJpegDataUrl(svg);
      const pdf = jpegDataUrlToPdf(jpeg);
      downloadBlob(pdf, `${certificate.verification_code}.pdf`);
    } catch {
      toast.error("PDF download failed.");
    }
  };

  if (loading || studentLoading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((index) => (
            <div key={index} className="h-64 rounded-2xl border border-border/30 bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="font-display text-xl text-foreground">{t("myCertificates")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Certificates are issued automatically when a course is completed.
        </p>
      </div>

      {certificates.length === 0 ? (
        <motion.div variants={item} className="glass-card p-8 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg text-foreground">No certificates yet</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Complete a course to unlock your certificate.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <motion.div key={certificate.id} variants={item} className="glass-card p-3">
              <div
                className="max-h-52 overflow-hidden rounded-lg border border-primary/20 bg-white [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: certificateSvgForPreview(certificate) }}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-ui text-sm font-semibold text-foreground">
                    {certificate.course?.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {certificate.verification_code}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void downloadPdf(certificate)}
                    className="glass-button flex items-center gap-1.5 px-3 py-2 text-[10px]"
                  >
                    <FileText className="h-3 w-3" />
                    PDF
                  </button>
                  <button
                    onClick={() => void downloadJpg(certificate)}
                    className="glass-button flex items-center gap-1.5 px-3 py-2 text-[10px]"
                  >
                    <FileImage className="h-3 w-3" />
                    JPG
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <>
          <h2 className="font-display text-sm text-foreground">{t("inProgress")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((enrollment) => (
              <motion.div
                key={enrollment.course.id}
                variants={item}
                className="glass-card relative p-5 text-center opacity-75"
              >
                <Lock className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-3 font-ui text-sm font-medium text-foreground">
                  {enrollment.course.title}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${enrollment.progress}%` }}
                    viewport={{ once: true }}
                  />
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {enrollment.progress}% complete - certificate unlocks when completed
                </p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}


