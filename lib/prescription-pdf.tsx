import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2 solid #0D9488",
  },
  doctorName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0D9488" },
  specialty: { fontSize: 10, color: "#475569", marginTop: 2 },
  cedula: { fontSize: 9, color: "#64748b", marginTop: 2 },
  clinicInfo: { fontSize: 9, color: "#94a3b8", marginTop: 1 },
  dateSection: { alignItems: "flex-end" },
  dateLabel: { fontSize: 8, color: "#94a3b8" },
  dateValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  patientSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 10,
    borderBottom: "1 solid #e2e8f0",
  },
  label: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 },
  patientName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  patientAge: { fontSize: 9, color: "#64748b" },

  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  medItem: {
    flexDirection: "row",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1 solid #f1f5f9",
  },
  medNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0D9488",
    color: "white",
    fontSize: 9,
    textAlign: "center",
    paddingTop: 4,
    marginRight: 10,
    flexShrink: 0,
    fontFamily: "Helvetica-Bold",
  },
  medContent: { flex: 1 },
  medName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  medDetails: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 2 },
  medDetail: { fontSize: 9, color: "#475569" },
  medDetailBold: { fontFamily: "Helvetica-Bold" },
  medInstructions: { fontSize: 9, color: "#64748b", fontStyle: "italic" },

  notes: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  notesTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#475569" },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 30,
    paddingTop: 16,
    borderTop: "1 solid #e2e8f0",
  },
  signatureLine: { width: 180, borderBottom: "1 solid #64748b", marginBottom: 4 },
  signatureName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  signatureRole: { fontSize: 8, color: "#64748b" },
  footer: { alignItems: "flex-end", textAlign: "right" },
  footerMain: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#475569" },
  footerSub: { fontSize: 8, color: "#94a3b8" },
});

export function PrescriptionPDF({ prescription, age }: { prescription: Prescription; age: number }) {
  const { note } = prescription;
  const medications = prescription.medications as Medication[];
  const date = format(new Date(prescription.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.doctorName}>{note.doctor.name}</Text>
            {note.doctor.specialty && <Text style={styles.specialty}>{note.doctor.specialty}</Text>}
            {note.doctor.cedula && (
              <Text style={styles.cedula}>Cédula Profesional: {note.doctor.cedula}</Text>
            )}
            {note.doctor.clinicName && (
              <Text style={[styles.clinicInfo, { marginTop: 6 }]}>{note.doctor.clinicName}</Text>
            )}
            {note.doctor.clinicAddress && (
              <Text style={styles.clinicInfo}>{note.doctor.clinicAddress}</Text>
            )}
            {note.doctor.clinicPhone && (
              <Text style={styles.clinicInfo}>Tel: {note.doctor.clinicPhone}</Text>
            )}
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Fecha de emisión</Text>
            <Text style={styles.dateValue}>{format(new Date(prescription.createdAt), "dd/MM/yyyy")}</Text>
          </View>
        </View>

        {/* Patient */}
        <View style={styles.patientSection}>
          <View>
            <Text style={styles.label}>Paciente</Text>
            <Text style={styles.patientName}>{note.patient.fullName}</Text>
            <Text style={styles.patientAge}>{age} años</Text>
          </View>
          {note.diagnosisDescription && (
            <View style={{ maxWidth: 220, alignItems: "flex-end" }}>
              <Text style={styles.label}>Diagnóstico</Text>
              <Text style={{ fontSize: 9, color: "#475569", textAlign: "right" }}>
                {note.diagnosisDescription}
              </Text>
            </View>
          )}
        </View>

        {/* Medications */}
        <Text style={styles.sectionTitle}>Medicamentos prescritos</Text>
        {medications.map((med, i) => (
          <View key={i} style={styles.medItem}>
            <Text style={styles.medNumber}>{i + 1}</Text>
            <View style={styles.medContent}>
              <Text style={styles.medName}>{med.name}</Text>
              <View style={styles.medDetails}>
                <Text style={styles.medDetail}>
                  Dosis: <Text style={styles.medDetailBold}>{med.dose}</Text>
                </Text>
                <Text style={styles.medDetail}>
                  Vía: <Text style={styles.medDetailBold}>{med.route}</Text>
                </Text>
                <Text style={styles.medDetail}>
                  Frecuencia: <Text style={styles.medDetailBold}>{med.frequency}</Text>
                </Text>
                <Text style={styles.medDetail}>
                  Duración: <Text style={styles.medDetailBold}>{med.duration}</Text>
                </Text>
              </View>
              {med.instructions && (
                <Text style={styles.medInstructions}>{med.instructions}</Text>
              )}
            </View>
          </View>
        ))}

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Indicaciones generales:</Text>
            <Text style={styles.notesText}>{prescription.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{note.doctor.name}</Text>
            {note.doctor.specialty && (
              <Text style={styles.signatureRole}>{note.doctor.specialty}</Text>
            )}
            {note.doctor.cedula && (
              <Text style={styles.signatureRole}>Cédula: {note.doctor.cedula}</Text>
            )}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerMain}>Receta válida por 30 días</Text>
            <Text style={styles.footerSub}>
              a partir del {format(new Date(prescription.createdAt), "dd/MM/yyyy")}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
