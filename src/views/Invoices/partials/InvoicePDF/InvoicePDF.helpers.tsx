import { JSX } from 'react';

import { Path, Svg, Text, View } from '@react-pdf/renderer';

import { styles } from './InvoicePDF.styles';

export const LogoSVG = () => (
  <Svg width={72} height={25} viewBox="0 0 72 25">
    <Path d="M0 0h72v25H0z" fill="#141857" />
    <Path
      d="M8.098 13.263a4.468 4.468 0 0 1-.097-.839 4.54 4.54 0 0 1 .678-2.47 5.074 5.074 0 0 1 1.947-1.813 5.64 5.64 0 0 1 2.679-.655c.94.005 1.862.24 2.67.683A5.06 5.06 0 0 1 17.901 10c.452.758.676 1.613.647 2.477a4.47 4.47 0 0 1-.107.837 4.63 4.63 0 0 1-.701 1.6l-1.54-.892a3 3 0 0 0 .529-1.595 2.97 2.97 0 0 0-.424-1.622 3.313 3.313 0 0 0-1.261-1.2 3.689 3.689 0 0 0-1.75-.448 3.694 3.694 0 0 0-1.754.43 3.323 3.323 0 0 0-1.275 1.187 2.973 2.973 0 0 0-.444 1.618 2.99 2.99 0 0 0 .51 1.6l-1.551.876a4.621 4.621 0 0 1-.682-1.606Z"
      fill="#8EB2FF"
      fillRule="evenodd"
    />
    <Path
      d="m13.276 13.057 4.626 2.778c.447.27.58.831.297 1.256-.284.425-.876.55-1.324.282l-3.6-2.162-3.599 2.162a.99.99 0 0 1-1.324-.282.883.883 0 0 1 .297-1.256l4.627-2.778Zm8.919-3.982v6.84h.97l.047-.79c.159.237.355.432.59.585.337.214.732.322 1.185.322.482 0 .906-.108 1.272-.322.367-.216.65-.515.852-.9.208-.384.312-.83.312-1.338 0-.514-.104-.96-.312-1.338a2.205 2.205 0 0 0-.852-.9 2.474 2.474 0 0 0-1.272-.322c-.453 0-.848.108-1.186.323a2.04 2.04 0 0 0-.582.574V9.075h-1.024Zm1.024 4.397c0 .339.065.638.194.899.13.254.31.456.54.606.23.143.492.215.786.215.324 0 .607-.072.852-.215a1.57 1.57 0 0 0 .571-.606c.144-.26.216-.56.216-.899a1.85 1.85 0 0 0-.205-.89 1.485 1.485 0 0 0-.571-.605 1.596 1.596 0 0 0-.852-.225 1.462 1.462 0 0 0-1.337.83 1.984 1.984 0 0 0-.194.89Zm22.33.87v1.573h1.023v-1.573h1.477v-.85h-1.477V9.075h-1.1l-3.405 4.514v.753h3.481Zm0-.85H43.23l2.317-3.078v3.078Zm8.953 2.217c.41.216.884.323 1.423.323.525 0 .988-.107 1.39-.322.41-.222.73-.525.96-.91.23-.384.345-.826.345-1.328 0-.502-.115-.944-.345-1.329a2.384 2.384 0 0 0-.96-.899c-.41-.221-.88-.332-1.411-.332-.532 0-1.003.11-1.413.332a2.38 2.38 0 0 0-.959.9c-.23.384-.345.826-.345 1.328 0 .502.115.944.345 1.329.237.384.56.687.97.909Zm2.285-.742a1.711 1.711 0 0 1-.862.215 1.8 1.8 0 0 1-.884-.215 1.601 1.601 0 0 1-.603-.606 1.774 1.774 0 0 1-.216-.889c0-.339.072-.635.215-.89.144-.253.342-.452.593-.595.252-.15.543-.225.873-.225.324 0 .615.075.874.225.258.143.456.342.592.596.144.254.216.55.216.89 0 .338-.072.634-.216.888a1.54 1.54 0 0 1-.582.606Zm6.184.24.05.708h.949V11.03h-1.013v2.54c0 .508-.122.902-.367 1.182-.244.28-.585.42-1.024.42a1.74 1.74 0 0 1-.679-.146.983.983 0 0 1-.474-.489c-.108-.234-.162-.57-.162-1.006v-2.502h-1.024v2.747c0 .528.083.957.248 1.29.172.332.413.576.722.732.316.157.683.235 1.1.235.445 0 .823-.098 1.132-.293.215-.137.396-.314.541-.533Zm-13.954 2.78c-.158 0-.334-.027-.528-.08a4.892 4.892 0 0 1-.582-.204l.377-.762c.158.065.295.114.41.146.122.033.219.049.29.049.18 0 .331-.046.454-.137a.975.975 0 0 0 .312-.38l.337-.721-2.353-4.868h1.09l1.751 3.807 1.72-3.807h1.099l-2.555 5.49c-.137.3-.28.56-.431.782a1.55 1.55 0 0 1-.56.508c-.216.117-.493.176-.83.176Zm-8.077-1.955c-.54 0-.956-.124-1.25-.371-.295-.254-.443-.616-.443-1.085v-2.745h-.916v-.802h.916V9.505h1.024v1.524h1.53v.802h-1.53v2.608c0 .241.065.427.194.557.137.124.33.186.582.186a.806.806 0 0 0 .238-.04c.086-.025.19-.077.312-.155l.388.723c-.187.11-.366.192-.539.244a1.675 1.675 0 0 1-.506.078Zm-3.807-.758.032.64h.95l.01-2.657c.007-.508-.076-.935-.248-1.28a1.724 1.724 0 0 0-.755-.791c-.337-.183-.761-.274-1.272-.274a2.69 2.69 0 0 0-.959.156 2.064 2.064 0 0 0-.7.41 2.36 2.36 0 0 0-.486.587l.906.313a1.3 1.3 0 0 1 .507-.489 1.62 1.62 0 0 1 .732-.156c.302 0 .543.062.723.186.187.123.323.306.41.547.058.152.099.328.12.527h-1.447c-.66 0-1.178.134-1.552.4-.366.261-.55.643-.55 1.144 0 .469.176.837.529 1.104.359.26.858.39 1.498.39s1.114-.191 1.423-.575c.046-.058.09-.118.129-.182Zm-.01-1.548h-1.186c-.496 0-.845.072-1.046.215a.658.658 0 0 0-.302.576.62.62 0 0 0 .28.538c.195.124.46.186.798.186.295 0 .55-.056.765-.167a1.29 1.29 0 0 0 .507-.488c.122-.209.183-.446.183-.713v-.147Zm-6.529 2.306c-.539 0-1.013-.107-1.423-.322a2.532 2.532 0 0 1-.97-.91 2.539 2.539 0 0 1-.345-1.328c0-.502.115-.944.345-1.329.23-.384.55-.684.96-.899.41-.221.88-.332 1.412-.332.531 0 1.002.11 1.412.332.41.215.729.515.959.9.23.384.345.826.345 1.328 0 .502-.115.944-.345 1.329-.23.384-.55.687-.96.909-.402.214-.865.322-1.39.322Zm0-.85c.323 0 .61-.072.862-.215a1.54 1.54 0 0 0 .582-.606c.144-.254.216-.55.216-.889 0-.339-.072-.635-.215-.89a1.46 1.46 0 0 0-.593-.595 1.71 1.71 0 0 0-.873-.225c-.331 0-.622.075-.874.225a1.548 1.548 0 0 0-.592.596c-.144.254-.216.55-.216.89 0 .338.072.634.216.888.143.254.345.456.603.606.259.143.553.215.884.215Z"
      fill="#fff"
      fillRule="evenodd"
    />
  </Svg>
);

/** Croatian-style money formatting per PDF locale: 1.234,56 (hr) / 1,234.56 (en). */
export const formatMoney = (value: unknown, locale: 'hr' | 'en'): string =>
  new Intl.NumberFormat(locale === 'hr' ? 'hr-HR' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

interface MetaItem {
  label: string;
  value: string;
}

export const renderMetaStrip = (items: MetaItem[]): JSX.Element => (
  <View style={styles.metaRow}>
    {items.map(item => (
      <View key={item.label} style={styles.metaCell}>
        <Text style={styles.metaLabel}>{item.label}</Text>
        <Text style={styles.metaValue}>{item.value}</Text>
      </View>
    ))}
  </View>
);

interface PartyProps {
  label: string;
  name: string;
  lines: string[];
  vatLabel: string;
  vatId?: string;
}

export const renderParty = ({ label, name, lines, vatLabel, vatId }: PartyProps): JSX.Element => (
  <View style={styles.party}>
    <Text style={styles.partyLabel}>{label}</Text>
    <Text style={styles.partyName}>{name}</Text>
    {lines.filter(Boolean).map(line => (
      <Text key={line} style={styles.partyLine}>
        {line}
      </Text>
    ))}
    {vatId ? (
      <Text style={styles.partyMuted}>
        {vatLabel}: {vatId}
      </Text>
    ) : null}
  </View>
);

interface ItemsTableProps {
  headers: { no: string; description: string; qty: string; unitPrice: string; amount: string };
  description: string;
  unitPrice: string;
  amount: string;
}

export const renderItemsTable = ({ headers, description, unitPrice, amount }: ItemsTableProps): JSX.Element => (
  <View style={styles.table}>
    <View style={styles.thead}>
      <Text style={[styles.th, styles.colNo]}>{headers.no}</Text>
      <Text style={[styles.th, styles.colDesc]}>{headers.description}</Text>
      <Text style={[styles.th, styles.colQty]}>{headers.qty}</Text>
      <Text style={[styles.th, styles.colUnit]}>{headers.unitPrice}</Text>
      <Text style={[styles.th, styles.colAmount]}>{headers.amount}</Text>
    </View>
    <View style={styles.tr}>
      <Text style={[styles.td, styles.colNo]}>1.</Text>
      <Text style={[styles.td, styles.colDesc]}>{description}</Text>
      <Text style={[styles.td, styles.colQty]}>1</Text>
      <Text style={[styles.td, styles.colUnit]}>{unitPrice}</Text>
      <Text style={[styles.td, styles.colAmount]}>{amount}</Text>
    </View>
  </View>
);

interface SummaryProps {
  baseLabel: string;
  base: string;
  vatLabel: string | null;
  vat: string | null;
  noVatNote: string | null;
  totalLabel: string;
  total: string;
}

export const renderSummary = ({ baseLabel, base, vatLabel, vat, noVatNote, totalLabel, total }: SummaryProps): JSX.Element => (
  <View style={styles.summaryWrap}>
    <View style={styles.summary}>
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>{baseLabel}</Text>
        <Text style={styles.sumValue}>{base}</Text>
      </View>
      {vatLabel && vat ? (
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>{vatLabel}</Text>
          <Text style={styles.sumValue}>{vat}</Text>
        </View>
      ) : null}
      {noVatNote ? <Text style={styles.sumNote}>{noVatNote}</Text> : null}
      <View style={styles.sumTotal}>
        <Text style={styles.sumTotalLabel}>{totalLabel}</Text>
        <Text style={styles.sumTotalValue}>{total}</Text>
      </View>
    </View>
  </View>
);

interface PaymentBoxProps {
  title: string;
  cells: MetaItem[];
}

export const renderPaymentBox = ({ title, cells }: PaymentBoxProps): JSX.Element => (
  <View style={styles.payBox}>
    <Text style={styles.payTitle}>{title}</Text>
    <View style={styles.payGrid}>
      {cells.map(cell => (
        <View key={cell.label} style={styles.payCell}>
          <Text style={styles.payLabel}>{cell.label}</Text>
          <Text style={styles.payValue}>{cell.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

export const renderFooter = ({ text }: { text: string }): JSX.Element => (
  <View style={styles.footer} fixed>
    {text.split('\n').map(line => (
      <Text key={line} style={styles.footerText}>
        {line}
      </Text>
    ))}
  </View>
);
