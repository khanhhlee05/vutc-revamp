import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";

export type PayrollPdfData = {
  payrollId: number;
  createdDate: string;
  paidOutDate: string;
  rangeStart: string;
  rangeEnd: string;
  events: {
    id: number;
    name: string;
    date: string;
    price: number;
    vutcShare: number;
    workers: { name: string; role: string; pay: number; deduction: boolean }[];
  }[];
  perWorker: { name: string; total: number }[];
  totals: { income: number; payout: number; vutcShare: number; rentals: number };
};

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica" },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a3e8c", marginBottom: 2 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 3 },
  muted: { color: "#555" },
  row: { flexDirection: "row", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  head: { flexDirection: "row", paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: "#111", fontFamily: "Helvetica-Bold" },
  c3: { flex: 3 },
  c2: { flex: 2 },
  c1: { flex: 1, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
});

export function PayrollDocument({ data }: { data: PayrollPdfData }) {
  return (
    <Document title={`VUTC Payroll #${data.payrollId}`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.h1}>VUTC Payroll #{data.payrollId}</Text>
        <Text style={s.muted}>
          Events {data.rangeStart} to {data.rangeEnd} · created {data.createdDate}
          {data.paidOutDate ? ` · paid out ${data.paidOutDate}` : ""}
        </Text>

        <Text style={s.h2}>Pay summary</Text>
        <View style={s.head}>
          <Text style={s.c3}>Staff member</Text>
          <Text style={s.c1}>Total</Text>
        </View>
        {data.perWorker.map((w) => (
          <View key={w.name} style={s.row}>
            <Text style={s.c3}>{w.name}</Text>
            <Text style={s.c1}>{formatMoney(w.total)}</Text>
          </View>
        ))}
        <View style={[s.row, { borderBottomWidth: 0 }]}>
          <Text style={[s.c3, s.bold]}>Total payout</Text>
          <Text style={[s.c1, s.bold]}>{formatMoney(data.totals.payout)}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.c3}>Event income</Text>
          <Text style={s.c1}>{formatMoney(data.totals.income)}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.c3}>VUTC share</Text>
          <Text style={s.c1}>{formatMoney(data.totals.vutcShare)}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.c3}>Rental pass-through</Text>
          <Text style={s.c1}>{formatMoney(data.totals.rentals)}</Text>
        </View>

        <Text style={s.h2}>Events</Text>
        {data.events.map((e) => (
          <View key={e.id} style={{ marginBottom: 6 }} wrap={false}>
            <View style={s.head}>
              <Text style={s.c3}>
                #{e.id} {e.name}
              </Text>
              <Text style={s.c2}>{e.date}</Text>
              <Text style={s.c1}>{formatMoney(e.price)}</Text>
            </View>
            {e.workers.map((w, i) => (
              <View key={i} style={s.row}>
                <Text style={s.c3}>{w.name}</Text>
                <Text style={s.c2}>
                  {w.role}
                  {w.deduction ? " (deduction)" : ""}
                </Text>
                <Text style={s.c1}>{formatMoney(w.pay)}</Text>
              </View>
            ))}
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.c3} />
              <Text style={[s.c2, s.muted]}>VUTC share</Text>
              <Text style={[s.c1, s.muted]}>{formatMoney(e.vutcShare)}</Text>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderPayrollPdf(data: PayrollPdfData): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<PayrollDocument data={data} />));
}
