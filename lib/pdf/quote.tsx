import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";

export type QuoteLine = {
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

export type QuoteData = {
  kind: "quote" | "invoice";
  eventId: number;
  eventName: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  advisorName: string;
  advisorEmail: string;
  accountIndex: string;
  eventDate: string;
  timeRange: string;
  location: string;
  issuedDate: string;
  lines: QuoteLine[];
  subtotal: number;
  rentalPrice: number;
  rentalDescription: string;
  discount: number;
  total: number;
  notice: string;
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a3e8c" },
  muted: { color: "#555" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 4 },
  head: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111", paddingVertical: 4, fontFamily: "Helvetica-Bold" },
  cDesc: { flex: 4 },
  cNum: { flex: 1, textAlign: "right" },
  totals: { marginTop: 8, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  bold: { fontFamily: "Helvetica-Bold" },
  section: { marginTop: 14 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#777", textAlign: "center" },
});

export function QuoteDocument({ data }: { data: QuoteData }) {
  const label = data.kind === "quote" ? "Quote" : "Invoice";
  return (
    <Document title={`VUTC ${label} #${data.eventId}`} author="Villanova University Tech Crew">
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Villanova University Tech Crew</Text>
            <Text style={s.muted}>800 Lancaster Ave, Villanova, PA 19085</Text>
            <Text style={s.muted}>Tolentine 009 · events@vutc.com</Text>
          </View>
          <View>
            <Text style={s.title}>{label}</Text>
            <Text style={{ textAlign: "right" }}>#{data.eventId}</Text>
            <Text style={{ textAlign: "right" }}>{data.issuedDate}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: "48%" }}>
            <Text style={s.bold}>BILL TO</Text>
            <Text>{data.orgName}</Text>
            <Text>{data.contactName} · {data.contactEmail}</Text>
            {data.advisorName ? <Text>Advisor: {data.advisorName} · {data.advisorEmail}</Text> : null}
            {data.accountIndex ? <Text>Account index: {data.accountIndex}</Text> : null}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={s.bold}>EVENT</Text>
            <Text>{data.eventName}</Text>
            <Text>{data.eventDate}</Text>
            <Text>{data.timeRange}</Text>
            <Text>{data.location}</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.head}>
            <Text style={s.cDesc}>DESCRIPTION</Text>
            <Text style={s.cNum}>UNIT PRICE</Text>
            <Text style={s.cNum}>QUANTITY</Text>
            <Text style={s.cNum}>TOTAL</Text>
          </View>
          {data.lines.map((l, i) => (
            <View key={i} style={s.row}>
              <View style={s.cDesc}>
                <Text>{l.name}</Text>
                {l.description ? <Text style={s.muted}>{l.description}</Text> : null}
              </View>
              <Text style={s.cNum}>{formatMoney(l.unitPrice)}</Text>
              <Text style={s.cNum}>{l.quantity}</Text>
              <Text style={s.cNum}>{formatMoney(l.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(data.subtotal)}</Text>
          </View>
          {data.rentalPrice > 0 ? (
            <View style={s.totalRow}>
              <Text>Rentals</Text>
              <Text>{formatMoney(data.rentalPrice)}</Text>
            </View>
          ) : null}
          {data.discount > 0 ? (
            <View style={s.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatMoney(data.discount)}</Text>
            </View>
          ) : null}
          <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: "#111", marginTop: 2 }]}>
            <Text style={s.bold}>TOTAL</Text>
            <Text style={s.bold}>{formatMoney(data.total)}</Text>
          </View>
        </View>

        {data.rentalDescription ? (
          <View style={s.section}>
            <Text style={s.bold}>RENTAL DESCRIPTION</Text>
            <Text>{data.rentalDescription}</Text>
          </View>
        ) : null}
        <View style={s.section}>
          <Text style={s.bold}>NOTICE</Text>
          <Text>{data.notice}</Text>
        </View>
        <Text style={s.footer}>
          This {label.toLowerCase()} was created digitally and is valid without signature or seal.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderQuotePdf(data: QuoteData): Promise<Buffer> {
  const buf = await renderToBuffer(<QuoteDocument data={data} />);
  return Buffer.from(buf);
}
