import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
} from "lucide-react";

export function getFileIcon(mimeType: string | null) {
  if (!mimeType) {
    return <File className="h-5 w-5 text-[#7C7265]" />;
  }

  if (mimeType === "application/pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  }

  if (mimeType.includes("image")) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed")
  ) {
    return <FileArchive className="h-5 w-5 text-amber-600" />;
  }

  return <File className="h-5 w-5 text-[#7C7265]" />;
}