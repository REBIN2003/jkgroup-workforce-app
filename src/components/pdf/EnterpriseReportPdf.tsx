"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#003366",
    paddingBottom: 8,
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003366",
  },
  meta: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    minHeight: 20,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F0F4F8",
    fontWeight: "bold",
    color: "#003366",
  },
  cell: {
    padding: 4,
    flex: 1,
  },
});

interface EnterpriseReportPdfProps {
  title: string;
  headers: string[];
  rows: Record<string, any>[];
  generatedAt: string;
}

export function EnterpriseReportDocument({
  title,
  headers,
  rows,
  generatedAt,
}: EnterpriseReportPdfProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ENTERPRISE ERP MANAGEMENT REPORT: {title.toUpperCase()}</Text>
          <Text style={styles.meta}>Generated on {generatedAt} | Official Corporate Record</Text>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {headers.map((h, i) => (
              <Text key={i} style={styles.cell}>
                {h}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {rows.map((row, rIdx) => (
            <View key={rIdx} style={styles.tableRow}>
              {Object.values(row).map((val, cIdx) => (
                <Text key={cIdx} style={styles.cell}>
                  {String(val)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function DownloadReportPdfButton(props: EnterpriseReportPdfProps) {
  return (
    <PDFDownloadLink
      document={<EnterpriseReportDocument {...props} />}
      fileName={`Report_${props.title.replace(/\s+/g, "_")}.pdf`}
      className="btn btn-erp-primary btn-sm"
    >
      {({ loading }) => (
        <span>
          <i className="bi bi-file-earmark-pdf me-1"></i>
          {loading ? "GENERATING PDF..." : "DOWNLOAD PDF REPORT"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
