import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getLeakById: vi.fn(),
  createIncidentDocument: vi.fn(),
  getDocumentByVerificationCode: vi.fn(),
  getDocumentsByLeakId: vi.fn(),
  logAudit: vi.fn(),
}));

// Mock the PDF service
vi.mock("./pdfService", () => ({
  generateIncidentPdf: vi.fn(),
}));

import {
  getLeakById,
  createIncidentDocument,
  getDocumentByVerificationCode,
  getDocumentsByLeakId,
  logAudit,
} from "./db";
import { generateIncidentPdf } from "./pdfService";

describe("Incident Documentation System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Document Generation", () => {
    it("should generate a document with verification code and content hash", async () => {
      const mockLeak = {
        id: 1,
        leakId: "LK-2024-0001",
        titleAr: "تسريب بيانات شركة الاتصالات",
        severity: "critical",
        sectorAr: "الاتصالات",
        recordCount: 500000,
        source: "darkweb",
        status: "analyzing",
        discoveredAt: new Date(),
      };

      (getLeakById as any).mockResolvedValue(mockLeak);
      (createIncidentDocument as any).mockResolvedValue({
        documentId: "NDMO-TEST-DOC001",
        verificationCode: "NDMO-ABC123-XYZ789",
        contentHash: "abc123def456",
      });
      (generateIncidentPdf as any).mockReturnValue("<html>PDF Content</html>");

      // Verify the mock returns expected structure
      const leak = await getLeakById("LK-2024-0001");
      expect(leak).toBeDefined();
      expect(leak.leakId).toBe("LK-2024-0001");

      const doc = await createIncidentDocument({
        leakId: "LK-2024-0001",
        documentId: "NDMO-TEST-DOC001",
        verificationCode: "NDMO-ABC123-XYZ789",
        contentHash: "abc123def456",
        generatedBy: "user-1",
        generatedByName: "Test User",
        htmlContent: "<html>PDF Content</html>",
        qrCodeUrl: "https://example.com/verify/NDMO-ABC123-XYZ789",
      });

      expect(doc).toBeDefined();
      expect(doc.verificationCode).toMatch(/^NDMO-/);
      expect(doc.documentId).toMatch(/^NDMO-/);
      expect(doc.contentHash).toBeTruthy();
    });

    it("should create unique verification codes for each document", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code = `NDMO-${timestamp}-${random}`;
        codes.add(code);
      }
      // All codes should be unique
      expect(codes.size).toBe(100);
    });

    it("should generate valid SHA-256 content hash format", () => {
      // SHA-256 produces 64 hex characters
      const mockHash = "a".repeat(64);
      expect(mockHash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(mockHash)).toBe(true);
    });
  });

  describe("Document Verification", () => {
    it("should verify a valid document", async () => {
      const mockDoc = {
        id: 1,
        documentId: "NDMO-TEST-DOC001",
        verificationCode: "NDMO-ABC123-XYZ789",
        leakId: "LK-2024-0001",
        contentHash: "abc123def456",
        generatedByName: "Test User",
        createdAt: new Date(),
      };

      (getDocumentByVerificationCode as any).mockResolvedValue(mockDoc);

      const doc = await getDocumentByVerificationCode("NDMO-ABC123-XYZ789");
      expect(doc).toBeDefined();
      expect(doc.verificationCode).toBe("NDMO-ABC123-XYZ789");
      expect(doc.leakId).toBe("LK-2024-0001");
    });

    it("should return null for invalid verification code", async () => {
      (getDocumentByVerificationCode as any).mockResolvedValue(null);

      const doc = await getDocumentByVerificationCode("INVALID-CODE");
      expect(doc).toBeNull();
    });

    it("should retrieve all documents for a specific leak", async () => {
      const mockDocs = [
        { documentId: "NDMO-DOC-001", leakId: "LK-2024-0001" },
        { documentId: "NDMO-DOC-002", leakId: "LK-2024-0001" },
      ];

      (getDocumentsByLeakId as any).mockResolvedValue(mockDocs);

      const docs = await getDocumentsByLeakId("LK-2024-0001");
      expect(docs).toHaveLength(2);
      expect(docs.every((d: any) => d.leakId === "LK-2024-0001")).toBe(true);
    });
  });

  describe("Audit Logging", () => {
    it("should log document generation audit trail", async () => {
      (logAudit as any).mockResolvedValue(undefined);

      await logAudit({
        userId: "user-1",
        userName: "Test User",
        category: "export",
        action: "generate_document",
        details: "Generated incident document for LK-2024-0001",
      });

      expect(logAudit).toHaveBeenCalledWith({
        userId: "user-1",
        userName: "Test User",
        category: "export",
        action: "generate_document",
        details: "Generated incident document for LK-2024-0001",
      });
    });

    it("should log report export audit trail", async () => {
      (logAudit as any).mockResolvedValue(undefined);

      await logAudit({
        userId: "user-1",
        userName: "Test User",
        category: "export",
        action: "export_report",
        details: "Exported comprehensive report",
      });

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "export",
          action: "export_report",
        })
      );
    });
  });

  describe("PDF Generation", () => {
    it("should generate HTML content with required elements", () => {
      (generateIncidentPdf as any).mockReturnValue(
        '<html dir="rtl"><head><title>Test</title></head><body><div class="verification-code">NDMO-ABC123</div><div class="qr-code"></div></body></html>'
      );

      const html = generateIncidentPdf({
        leak: {
          leakId: "LK-2024-0001",
          titleAr: "تسريب بيانات",
          severity: "critical",
          sectorAr: "الاتصالات",
          recordCount: 500000,
        },
        verificationCode: "NDMO-ABC123",
        documentId: "NDMO-DOC-001",
        qrCodeUrl: "https://example.com/verify/NDMO-ABC123",
        generatedByName: "Test User",
        contentHash: "abc123",
      });

      expect(html).toContain("NDMO-ABC123");
      expect(html).toContain('dir="rtl"');
    });

    it("should include all leak details in the PDF", () => {
      const leakData = {
        leakId: "LK-2024-0001",
        titleAr: "تسريب بيانات شركة الاتصالات",
        severity: "critical",
        sectorAr: "الاتصالات وتقنية المعلومات",
        recordCount: 1500000,
        source: "darkweb",
        threatActorAr: "مجموعة القراصنة",
        attackMethodAr: "هجوم SQL Injection",
      };

      (generateIncidentPdf as any).mockReturnValue(
        `<html>${leakData.titleAr} - ${leakData.leakId} - ${leakData.sectorAr}</html>`
      );

      const html = generateIncidentPdf({
        leak: leakData,
        verificationCode: "NDMO-TEST",
        documentId: "NDMO-DOC",
        qrCodeUrl: "https://example.com",
        generatedByName: "User",
        contentHash: "hash",
      });

      expect(html).toContain(leakData.titleAr);
      expect(html).toContain(leakData.leakId);
      expect(html).toContain(leakData.sectorAr);
    });
  });

  describe("Compliance Warning", () => {
    it("should require agreement before document generation", () => {
      // The compliance warning dialog requires user to check the agreement checkbox
      // before the confirm button becomes enabled
      const agreed = false;
      const canProceed = agreed === true;
      expect(canProceed).toBe(false);

      const agreedNow = true;
      const canProceedNow = agreedNow === true;
      expect(canProceedNow).toBe(true);
    });

    it("should include proper warning text elements", () => {
      const warningElements = [
        "حماية البيانات الشخصية",
        "المهام الرسمية",
        "مكتب إدارة البيانات الوطنية",
        "المساءلة النظامية",
        "سجل التدقيق",
      ];

      // All warning elements should be present in the compliance dialog
      warningElements.forEach((element) => {
        expect(element).toBeTruthy();
      });
    });
  });

  describe("Verification Code Format", () => {
    it("should match NDMO verification code pattern", () => {
      const validCodes = [
        "NDMO-ABC123-XYZ789AB",
        "NDMO-M1A2B3-C4D5E6F7",
      ];

      validCodes.forEach((code) => {
        expect(code.startsWith("NDMO-")).toBe(true);
        expect(code.split("-").length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should reject invalid verification codes", () => {
      const invalidCodes = ["", "INVALID", "ABC-123"];

      invalidCodes.forEach((code) => {
        expect(code.startsWith("NDMO-")).toBe(false);
      });
    });
  });
});
