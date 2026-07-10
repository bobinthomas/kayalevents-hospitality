import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";
import { sortedSections } from "@/lib/day-type-presets";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 16, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  block: { marginBottom: 8, paddingBottom: 8, borderBottom: "1 solid #eee" },
  blockTitle: { fontFamily: "Helvetica-Bold" },
  blockMeta: { color: "#666", fontSize: 9 },
  blockContent: { marginTop: 2 },
});

function formatValue(value: string | string[] | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  return Array.isArray(value) ? value.join(", ") : value;
}

export function ItineraryPdfDocument({
  artistName,
  eventName,
  schema,
  responseData,
}: {
  artistName: string;
  eventName: string;
  schema: ItinerarySchema;
  responseData: ResponseData;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{artistName}</Text>
        <Text style={styles.subtitle}>{eventName} — Hospitality itinerary</Text>

        {sortedSections(schema.sections).map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.label} · {section.date}
            </Text>
            {section.blocks.map((block) => (
              <View key={block.id} style={styles.block}>
                {block.kind === "info" ? (
                  <>
                    <Text style={styles.blockTitle}>
                      {block.time ? `${block.time} — ` : ""}
                      {block.title}
                    </Text>
                    <Text style={styles.blockContent}>{block.content}</Text>
                  </>
                ) : block.kind === "transport" ? (
                  <>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockContent}>
                      {block.entries.map((entry) => `${entry.vehicle} — ${entry.purpose}`).join("; ")}
                    </Text>
                    {block.details && <Text style={styles.blockContent}>{block.details}</Text>}
                  </>
                ) : (
                  <>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockContent}>{formatValue(responseData[block.id])}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
