// ⚠️ DEPRECATED: HelpModal is no longer used
// Guide sekarang ada di halaman dedicated: /tools-guide (ToolsGuidePage.tsx)
// Modal ini sudah tidak digunakan lagi

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // Modal tidak digunakan lagi, return null
  return null
}
