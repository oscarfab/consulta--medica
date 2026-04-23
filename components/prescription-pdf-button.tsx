"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  createdAt: string | Date;
  medications: unknown;
  notes?: string | null;
  note: {
    diagnosisDescription?: string | null;
    patient: { fullName: string; birthdate: string | Date };
    doctor: {
      name: string;
      specialty?: string | null;
      cedula?: string | null;
      clinicName?: string | null;
      clinicAddress?: string | null;
      clinicPhone?: string | null;
    };
  };
}

interface Props {
  prescription: Prescription;
  age: number;
}

export function PrescriptionPDFButton({ prescription, age }: Props) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { PrescriptionPDF } = await import("@/lib/prescription-pdf");
      const React = (await import("react")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(PrescriptionPDF, { prescription, age }) as any;
      const blob = await pdf(element).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receta_${prescription.note.patient.fullName.replace(/\s+/g, "_")}_${format(new Date(prescription.createdAt), "yyyy-MM-dd")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF error:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={generating}
      className="bg-[#0D9488] hover:bg-[#0f766e] text-white gap-1.5"
    >
      <Download className="w-4 h-4" />
      {generating ? "Generando PDF..." : "Descargar PDF"}
    </Button>
  );
}
