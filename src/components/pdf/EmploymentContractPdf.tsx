"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#003366",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666666",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 6,
    backgroundColor: "#F0F4F8",
    padding: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  text: {
    lineHeight: 1.4,
    marginBottom: 6,
  },
  footer: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigBox: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 5,
    textAlign: "center",
  },
});

interface ContractPdfProps {
  employeeName: string;
  employeeId: string;
  roleName: string;
  companyName: string;
  issueDate: string;
}

export function EmploymentContractDocument({
  employeeName,
  employeeId,
  roleName,
  companyName,
  issueDate,
}: ContractPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ENTERPRISE EMPLOYMENT AGREEMENT</Text>
          <Text style={styles.subtitle}>{companyName} - Official HR Corporate Record</Text>
        </View>

        {/* Employee Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. EMPLOYEE & APPOINTMENT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Name:</Text>
            <Text style={styles.value}>{employeeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employee System ID:</Text>
            <Text style={styles.value}>{employeeId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Designated Position:</Text>
            <Text style={styles.value}>{roleName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Corporate Entity:</Text>
            <Text style={styles.value}>{companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Agreement Issue Date:</Text>
            <Text style={styles.value}>{issueDate}</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. TERMS OF EMPLOYMENT & COMPLIANCE</Text>
          <Text style={styles.text}>
            This document certifies that the aforementioned employee is bound by the rules, policies, and
            compliance frameworks established by {companyName}. Attendance, daily work logs, and leave
            applications must be logged accurately in the Enterprise ERP System.
          </Text>
          <Text style={styles.text}>
            Confidentiality and non-disclosure obligations apply to all proprietary company data, client projects,
            and operational materials accessed during employment.
          </Text>
        </View>

        {/* Signature Blocks */}
        <View style={styles.footer}>
          <View style={styles.sigBox}>
            <Text>{employeeName}</Text>
            <Text style={{ fontSize: 8, color: "#666" }}>Employee Digital Signature</Text>
          </View>
          <View style={styles.sigBox}>
            <Text>HR Corporate Director</Text>
            <Text style={{ fontSize: 8, color: "#666" }}>For {companyName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function DownloadContractButton(props: ContractPdfProps) {
  return (
    <PDFDownloadLink
      document={<EmploymentContractDocument {...props} />}
      fileName={`Contract_${props.employeeId}.pdf`}
      className="btn btn-erp-primary btn-sm"
    >
      {({ loading }) => (
        <span>
          <i className="bi bi-file-earmark-pdf me-1"></i>
          {loading ? "GENERATING PDF..." : "DOWNLOAD CONTRACT PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
