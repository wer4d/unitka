"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Inputs = {
  averageCheck: number;
  marginPercent: number;
  repeatSales: number;
  budget: number;
  otherExpenses: number;
  cpc: number;
  leadConversion: number;
  salesConversion: number;
};

type ModelKey = "goods" | "services" | "store" | "niche";
type NicheKey = "realEstate" | "autoService" | "dentistry" | "beautySalon" | "onlineStore" | "legalServices" | "fitnessClub";
type Theme = "light" | "dark";
const presets: Record<Exclude<ModelKey, "niche">, Inputs> = {
  goods: {
    averageCheck: 5500,
    marginPercent: 30,
    repeatSales: 2,
    budget: 150000,
    otherExpenses: 60000,
    cpc: 35,
    leadConversion: 3,
    salesConversion: 30,
  },
  services: {
    averageCheck: 20000,
    marginPercent: 45,
    repeatSales: 1,
    budget: 150000,
    otherExpenses: 60000,
    cpc: 60,
    leadConversion: 4,
    salesConversion: 35,
  },
  store: {
    averageCheck: 3500,
    marginPercent: 20,
    repeatSales: 3,
    budget: 150000,
    otherExpenses: 60000,
    cpc: 35,
    leadConversion: 3,
    salesConversion: 30,
  },
};

const nichePresets: Record<NicheKey, { name: string; values: Inputs }> = {
  realEstate: { name: "Недвижимость", values: { averageCheck: 180000, marginPercent: 35, repeatSales: 1, budget: 300000, otherExpenses: 70000, cpc: 900, leadConversion: 2, salesConversion: 6 } },
  autoService: { name: "Автосервис", values: { averageCheck: 9000, marginPercent: 35, repeatSales: 3, budget: 120000, otherExpenses: 25000, cpc: 90, leadConversion: 4, salesConversion: 40 } },
  dentistry: { name: "Стоматология", values: { averageCheck: 25000, marginPercent: 35, repeatSales: 2, budget: 250000, otherExpenses: 60000, cpc: 450, leadConversion: 4, salesConversion: 30 } },
  beautySalon: { name: "Салон красоты", values: { averageCheck: 3500, marginPercent: 40, repeatSales: 6, budget: 90000, otherExpenses: 18000, cpc: 75, leadConversion: 4, salesConversion: 45 } },
  onlineStore: { name: "Интернет-магазин", values: { averageCheck: 4800, marginPercent: 25, repeatSales: 2, budget: 180000, otherExpenses: 35000, cpc: 40, leadConversion: 2, salesConversion: 70 } },
  legalServices: { name: "Юридические услуги", values: { averageCheck: 45000, marginPercent: 50, repeatSales: 1, budget: 160000, otherExpenses: 30000, cpc: 380, leadConversion: 3, salesConversion: 20 } },
  fitnessClub: { name: "Фитнес-клуб", values: { averageCheck: 15000, marginPercent: 35, repeatSales: 2, budget: 110000, otherExpenses: 22000, cpc: 100, leadConversion: 4, salesConversion: 30 } },
};

const metricGuide = [
  { name: "Клики", description: "Прогноз количества переходов на сайт из рекламы.", formula: "Рекламный бюджет ÷ средняя цена клика" },
  { name: "Лиды", description: "Количество посетителей, которые оставят заявку или обратятся в компанию.", formula: "Клики × конверсия сайта ÷ 100" },
  { name: "CPL", description: "Средняя стоимость получения одной заявки.", formula: "Учитываемые расходы ÷ лиды" },
  { name: "Клиенты", description: "Количество лидов, которые совершат покупку.", formula: "Лиды × квалификация (если включена) × конверсия в продажу" },
  { name: "CAC", description: "Средняя стоимость привлечения одного нового клиента.", formula: "Учитываемые расходы ÷ клиенты" },
  { name: "Продажи", description: "Количество первых и повторных покупок, которые клиенты успеют совершить за выбранный период.", formula: "Сумма продаж по клиентам каждого месяца с учётом оставшегося периода" },
  { name: "CPO", description: "Средняя стоимость получения одной продажи с учётом повторных покупок.", formula: "Учитываемые расходы ÷ продажи" },
  { name: "Выручка", description: "Общая сумма продаж до вычета расходов.", formula: "Продажи × средний чек" },
  { name: "Доход", description: "Маржинальный доход, который остаётся после прямых расходов на товары или услуги.", formula: "Выручка × маржа, % ÷ 100" },
  { name: "ROI", description: "Окупаемость вложений с учётом маржи и выбранных расходов.", formula: "(Маржинальный доход − учитываемые расходы) ÷ учитываемые расходы × 100%" },
  { name: "ДРР", description: "Доля учитываемых расходов в полученной выручке.", formula: "Учитываемые расходы ÷ выручка × 100%" },
  { name: "LTV", description: "Средний маржинальный доход от одного клиента в пределах выбранного периода.", formula: "Средний чек × маржа, % ÷ 100 × среднее число продаж на клиента за период" },
];

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function money(value: number) {
  return `${rub.format(Number.isFinite(value) ? value : 0)} ₽`;
}

function NumberInput({ value, label, decimal = false, step, listId, minValue = 0, onChange }: { value: number; label: string; decimal?: boolean; step?: number; listId?: string; minValue?: number; onChange: (value: number) => void }) {
  const [displayValue, setDisplayValue] = useState(String(value));
  // The local string preserves in-progress numeric typing while presets and model changes remain externally controlled.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDisplayValue(decimal ? String(Math.round(value * 10) / 10) : String(Math.round(value))), [value, decimal]);
  return (
    <input
      aria-label={label}
      type="number"
      inputMode={decimal ? "decimal" : "numeric"}
      min={minValue}
      step={step ?? (decimal ? 0.1 : 1)}
      list={listId}
      value={displayValue}
      onFocus={() => {
        if (displayValue === "0") setDisplayValue("");
      }}
      onBlur={() => {
        const parsed = Number(displayValue);
        if (displayValue === "" || !Number.isFinite(parsed) || parsed < minValue) {
          setDisplayValue(String(minValue));
          onChange(minValue);
        }
      }}
      onChange={(event) => {
        let next = event.target.value.replace(",", ".").replace(/[^\d.]/g, "");
        const [whole = "", ...fractionParts] = next.split(".");
        const cleanWhole = whole.replace(/^0+(?=\d)/, "");
        next = decimal && fractionParts.length
          ? `${cleanWhole}.${fractionParts.join("").slice(0, 1)}`
          : cleanWhole;
        if (!decimal) next = cleanWhole;
        if (next === "" || next === ".") {
          setDisplayValue(next);
          return;
        }
        const numericValue = Number(next);
        const normalizedValue = numericValue < minValue ? minValue : numericValue;
        setDisplayValue(String(normalizedValue));
        onChange(normalizedValue);
      }}
    />
  );
}

function Field({ label, value, suffix, decimal = false, step, onChange }: { label: string; value: number; suffix: string; decimal?: boolean; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        <NumberInput label={label} value={value} decimal={decimal} step={step} onChange={onChange} />
        <span>{suffix}</span>
      </span>
    </label>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "green" | "coral" }) {
  return <article className={`metric ${accent ?? ""}`}><div><small>{label}</small><b>{value}</b></div></article>;
}

export default function Home() {
  const [model, setModel] = useState<ModelKey>("services");
  const [inputs, setInputs] = useState<Inputs>(presets.services);
  const [niche, setNiche] = useState<NicheKey | null>(null);
  const [nicheOpen, setNicheOpen] = useState(false);
  const nichePresetRef = useRef<HTMLDivElement>(null);
  const [includeOtherExpenses, setIncludeOtherExpenses] = useState(false);
  const [qualification, setQualification] = useState(50);
  const [includeQualification, setIncludeQualification] = useState(false);
  const [calculationPeriod, setCalculationPeriod] = useState(1);
  const [conversionCorrection, setConversionCorrection] = useState(1);
  const [includeConversionCorrection, setIncludeConversionCorrection] = useState(false);
  const [dealCycle, setDealCycle] = useState(1);
  const [includeDealCycle, setIncludeDealCycle] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNameDraft, setCompanyNameDraft] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [metricsGuideOpen, setMetricsGuideOpen] = useState(false);
  const [calculationLogicOpen, setCalculationLogicOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("unitka-theme");
    const initialTheme: Theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = initialTheme;
    // Theme is restored only after hydration because localStorage is browser-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
  }, []);
  const chooseTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("unitka-theme", nextTheme);
  };
  useEffect(() => {
    if (!nicheOpen) return;
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!nichePresetRef.current?.contains(event.target as Node)) setNicheOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNicheOpen(false);
        nichePresetRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [nicheOpen]);
  useEffect(() => {
    if (!exportModalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExportModalOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [exportModalOpen]);
  const update = (key: keyof Inputs, value: number) => setInputs((current) => ({ ...current, [key]: value }));
  const chooseModel = (key: Exclude<ModelKey, "niche">) => {
    setModel(key);
    setNiche(null);
    setNicheOpen(false);
    setInputs(presets[key]);
  };
  const chooseNiche = (key: NicheKey) => {
    setNiche(key);
    setModel("niche");
    setInputs(nichePresets[key].values);
  };

  const result = useMemo(() => {
    const periodMultiplier = calculationPeriod;
    const totalAdvertisingExpenses = inputs.budget * periodMultiplier;
    const totalOtherExpenses = includeOtherExpenses ? inputs.otherExpenses * periodMultiplier : 0;
    const totalExpenses = totalAdvertisingExpenses + totalOtherExpenses;
    const monthlyClicks = inputs.cpc > 0 ? inputs.budget / inputs.cpc : 0;
    const clicks = Math.floor(monthlyClicks * periodMultiplier);
    const monthlyLeads = Array.from({ length: periodMultiplier }, (_, index) => {
      const monthlyCorrection = includeConversionCorrection
        ? conversionCorrection * ((index + 1) / periodMultiplier)
        : 0;
      const monthlySiteConversion = inputs.leadConversion * (1 + monthlyCorrection / 100);
      return monthlyClicks * monthlySiteConversion / 100;
    });
    const leads = Math.floor(monthlyLeads.reduce((sum, value) => sum + value, 0));
    const qualificationEnabled = model !== "store" && includeQualification;
    const qualificationRate = qualificationEnabled ? qualification / 100 : 1;
    const monthlyQualifiedLeads = monthlyLeads.map((monthlyLeadCount) => monthlyLeadCount * qualificationRate);
    const qualifiedLeads = Math.floor(monthlyQualifiedLeads.reduce((sum, value) => sum + value, 0));
    const monthlyClients = monthlyQualifiedLeads.map((monthlyLeadCount) => monthlyLeadCount * inputs.salesConversion / 100);
    const clients = monthlyClients.reduce((sum, value) => sum + value, 0);
    const annualSalesPerClient = Math.max(1, inputs.repeatSales);
    const repeatSalesPerMonth = (annualSalesPerClient - 1) / 12;
    const monthlySales = monthlyClients.map((monthlyClientCount, index) => {
      const monthsForRepeatSales = Math.max(0, periodMultiplier - index - 1);
      const salesPerClientInPeriod = 1 + repeatSalesPerMonth * monthsForRepeatSales;
      return monthlyClientCount * salesPerClientInPeriod;
    });
    const sales = monthlySales.reduce((sum, value) => sum + value, 0);
    const revenue = sales * inputs.averageCheck;
    const cpl = leads > 0 ? totalExpenses / leads : 0;
    const cac = clients > 0 ? totalExpenses / clients : 0;
    const cpo = sales > 0 ? totalExpenses / sales : 0;
    const marginPerSale = inputs.averageCheck * inputs.marginPercent / 100;
    const salesPerClientInPeriod = clients > 0 ? sales / clients : 0;
    const ltv = marginPerSale * salesPerClientInPeriod;
    const grossMargin = sales * marginPerSale;
    const roi = totalExpenses > 0 ? ((grossMargin - totalExpenses) / totalExpenses) * 100 : 0;
    const drr = revenue > 0 ? totalExpenses / revenue * 100 : 0;
    const cycleMonths = dealCycle;
    const maturedCohorts = Math.max(0, periodMultiplier - cycleMonths + 1);
    const periodSales = monthlySales.slice(0, maturedCohorts).reduce((sum, value) => sum + value, 0);
    const periodRevenue = periodSales * inputs.averageCheck;
    const periodGrossMargin = periodSales * marginPerSale;
    const periodRoi = totalExpenses > 0 ? ((periodGrossMargin - totalExpenses) / totalExpenses) * 100 : 0;
    const salesInWork = Math.max(0, sales - periodSales);
    const revenueInWork = salesInWork * inputs.averageCheck;
    return {
      clicks, leads, qualifiedLeads, cpl, clients, sales, revenue, cac, cpo, ltv, roi, drr, grossMargin, totalExpenses,
      periodSales, periodRevenue, periodGrossMargin, periodRoi, salesInWork, revenueInWork,
    };
  }, [inputs, includeOtherExpenses, calculationPeriod, conversionCorrection, includeConversionCorrection, dealCycle, qualification, includeQualification, model]);

  const positive = result.roi >= 0;
  const breakEven = useMemo(() => {
    const marginPerSale = inputs.averageCheck * inputs.marginPercent / 100;
    const sales = marginPerSale > 0 ? Math.ceil(result.totalExpenses / marginPerSale) : 0;
    const salesPerClientInPeriod = result.clients > 0 ? result.sales / result.clients : 1;
    const clients = salesPerClientInPeriod > 0 ? Math.ceil(sales / salesPerClientInPeriod) : 0;
    const qualifiedLeads = inputs.salesConversion > 0 ? Math.ceil(clients / (inputs.salesConversion / 100)) : 0;
    const qualificationRate = model !== "store" && includeQualification ? qualification / 100 : 1;
    const leads = qualificationRate > 0 ? Math.ceil(qualifiedLeads / qualificationRate) : 0;
    const revenue = sales * inputs.averageCheck;
    const siteConversion = result.clicks > 0 ? leads / result.clicks * 100 : 0;
    const salesConversion = result.qualifiedLeads > 0 ? clients / result.qualifiedLeads * 100 : 0;
    const marginPerClientInPeriod = marginPerSale * salesPerClientInPeriod;
    const maxCpl = marginPerClientInPeriod * inputs.salesConversion / 100 * qualificationRate;
    return { sales, clients, revenue, siteConversion, salesConversion, maxCpl, maxCac: marginPerClientInPeriod };
  }, [inputs, result.clicks, result.clients, result.qualifiedLeads, result.sales, result.totalExpenses, qualification, includeQualification, model]);
  const qualificationEnabled = model !== "store" && includeQualification;
  const additionalSales = Math.max(0, breakEven.sales - result.sales);
  const conclusion = positive
    ? `Вложенный рубль приносит ${qty.format(result.roi / 100 + 1)} ₽ маржинального дохода`
    : `Вложения не окупаются: не хватает ${money(Math.abs(result.grossMargin - result.totalExpenses))}`;
  const modelName = model === "niche" && niche
    ? nichePresets[niche].name
    : model === "goods" ? "Товары"
      : model === "store" ? "Магазин"
        : "Услуги";
  const printDate = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const finalEvaluationDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + calculationPeriod + dealCycle);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }, [calculationPeriod, dealCycle]);
  const exportPdf = () => {
    setCompanyNameDraft(companyName);
    setExportModalOpen(true);
  };
  const confirmExport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = companyNameDraft.trim();
    if (!cleanName) return;
    setCompanyName(cleanName);
    setExportModalOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  return (
    <main>
      <header className="header" id="top">
        <div className="header-inner">
          <div className="header-identity">
            <a className="brand" href="#top">
              <span className="brand-mark"><Image src={`${basePath}/supplied-logo.webp`} alt="Студия Павла Федотова" width={48} height={48} priority /></span>
              <b>Юнитка</b>
            </a>
            <span className="header-title">Юнит-экономика. Универсальный калькулятор v37</span>
          </div>
          <div className="theme-switch" role="group" aria-label="Цветовая тема">
            <button type="button" className={theme === "light" ? "active" : ""} aria-label="Светлая тема" aria-pressed={theme === "light"} onClick={() => chooseTheme("light")}>
              <span aria-hidden="true">☀</span><b>Светлая</b>
            </button>
            <button type="button" className={theme === "dark" ? "active" : ""} aria-label="Тёмная тема" aria-pressed={theme === "dark"} onClick={() => chooseTheme("dark")}>
              <span aria-hidden="true">☾</span><b>Тёмная</b>
            </button>
          </div>
        </div>
      </header>

      <section className="workspace">
        <div className="calculator">
          <section className="preset-section">
            <span className="step">Выберите тип бизнеса</span>
            <div className="preset-grid">
              <button className={`preset ${model === "goods" ? "active" : ""}`} aria-pressed={model === "goods"} onClick={() => chooseModel("goods")}>
                <span><b>Товары</b><small>Продажа физических товаров</small></span>{model === "goods" && <i>✓</i>}
              </button>
              <button className={`preset ${model === "services" ? "active" : ""}`} aria-pressed={model === "services"} onClick={() => chooseModel("services")}>
                <span><b>Услуги</b><small>Услуги и консультации</small></span>{model === "services" && <i>✓</i>}
              </button>
              <button className={`preset ${model === "store" ? "active" : ""}`} aria-pressed={model === "store"} onClick={() => chooseModel("store")}>
                <span><b>Магазин</b><small>Продажи напрямую в магазине</small></span>{model === "store" && <i>✓</i>}
              </button>
              <div
                ref={nichePresetRef}
                className={`preset niche-preset ${model === "niche" ? "active" : ""}`}
                role="button"
                tabIndex={0}
                aria-expanded={nicheOpen}
                onClick={() => setNicheOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setNicheOpen((open) => !open);
                }}
              >
                <span className="niche-content">
                  <b>Выбрать нишу</b>
                  <small>{niche ? nichePresets[niche].name : "Выберите нишу"}</small>
                </span>
                {model === "niche" && niche && <i>✓</i>}
                {nicheOpen && (
                  <div className="niche-menu" onClick={(event) => event.stopPropagation()}>
                    {Object.entries(nichePresets).map(([key, preset]) => (
                      <button key={key} type="button" onClick={() => { chooseNiche(key as NicheKey); setNicheOpen(false); }}>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="input-group">
            <div className="group-head"><span className="step">Экономика продаж</span></div>
            <div className="fields business-fields">
              <Field label="Средний чек" value={inputs.averageCheck} suffix="₽" step={100} onChange={(v) => update("averageCheck", v)} />
              <Field label="Средняя маржа" value={inputs.marginPercent} suffix="%" decimal onChange={(v) => update("marginPercent", v)} />
              <Field label="Продаж на клиента за год" value={inputs.repeatSales} suffix="раз" decimal onChange={(v) => update("repeatSales", Math.max(1, v))} />
              <div className="paired-field deal-cycle-field">
                <span className="field-label">Средний цикл сделки</span>
                <div className="paired-controls">
                  <span className={`field-control ${!includeDealCycle ? "muted-control" : ""}`}>
                    <NumberInput
                      label="Средний цикл сделки"
                      value={dealCycle}
                      step={1}
                      minValue={1}
                      onChange={(value) => setDealCycle(Math.max(1, Math.round(value || 1)))}
                    />
                    <span>мес.</span>
                  </span>
                  <label className={`period-correction-toggle ${includeDealCycle ? "active" : ""}`}>
                    <input type="checkbox" checked={includeDealCycle} onChange={(event) => setIncludeDealCycle(event.target.checked)} />
                    <span>Учитывать</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="input-group marketing-group">
            <div className="group-head"><span className="step">Воронка привлечения</span></div>
            <div className="fields marketing-fields">
              <Field label="Рекламный бюджет" value={inputs.budget} suffix="₽" step={10000} onChange={(v) => update("budget", v)} />
              <div className="paired-field other-expenses">
                <span className="field-label">Прочие расходы</span>
                <div className="paired-controls">
                  <span className={`field-control ${!includeOtherExpenses ? "muted-control" : ""}`}>
                    <NumberInput label="Прочие расходы" value={inputs.otherExpenses} onChange={(value) => update("otherExpenses", value)} />
                    <span>₽</span>
                  </span>
                  <label className={`period-correction-toggle ${includeOtherExpenses ? "active" : ""}`}>
                    <input type="checkbox" checked={includeOtherExpenses} onChange={(event) => setIncludeOtherExpenses(event.target.checked)} />
                    <span>Учитывать</span>
                  </label>
                </div>
              </div>
              <Field label="Средняя цена клика" value={inputs.cpc} suffix="₽" step={1} onChange={(v) => update("cpc", v)} />
              <Field label="Конверсия сайта" value={inputs.leadConversion} suffix="%" decimal onChange={(v) => update("leadConversion", v)} />
              {model !== "store" && <div className="paired-field qualification-field">
                <span className="field-label">Квалификация</span>
                <div className="paired-controls">
                  <span className={`field-control ${!includeQualification ? "muted-control" : ""}`}>
                    <NumberInput
                      label="Квалификация"
                      value={qualification}
                      step={1}
                      minValue={0}
                      onChange={(value) => setQualification(Math.min(100, Math.max(0, Math.round(value))))}
                    />
                    <span>%</span>
                  </span>
                  <label className={`period-correction-toggle ${includeQualification ? "active" : ""}`}>
                    <input type="checkbox" checked={includeQualification} onChange={(event) => setIncludeQualification(event.target.checked)} />
                    <span>Учитывать</span>
                  </label>
                </div>
              </div>}
              <Field label="Конверсия в продажу" value={inputs.salesConversion} suffix="%" step={1} onChange={(v) => update("salesConversion", v)} />
            </div>
          </section>
        </div>

        <aside className="results">
          <div className="results-head"><span className="step">Ожидаемый результат</span></div>
          <div className={`funnel ${qualificationEnabled ? "funnel-qualified" : ""}`}>
            <div><b>{qty.format(result.clicks)}</b><small>кликов</small></div><span>→</span>
            <div><b>{qty.format(result.leads)}</b><small>лидов</small></div><span>→</span>
            {qualificationEnabled && <><div><b>{qty.format(result.qualifiedLeads)}</b><small>квалифицированных лидов</small></div><span>→</span></>}
            <div><b>{qty.format(result.clients)}</b><small>клиентов</small></div><span>→</span>
            <div><b>{qty.format(result.sales)}</b><small>продаж</small></div>
          </div>
          <section className="calculation-period results-period">
            <div className="period-heading">
              <span className="step">Период расчёта</span>
              <small>Укажите период для расчета модели</small>
            </div>
            <div className="period-controls">
              <label className="period-field">
                <span className="field-label">Период расчёта</span>
                <span className="field-control">
                  <NumberInput
                    label="Период расчёта"
                    value={calculationPeriod}
                    step={1}
                    minValue={1}
                    onChange={(value) => setCalculationPeriod(Math.max(1, Math.round(value || 1)))}
                  />
                  <span>мес.</span>
                </span>
              </label>
              <label className="correction-field">
                <span className="field-label">% коррекции</span>
                <span className={`field-control ${!includeConversionCorrection ? "muted-control" : ""}`}>
                  <NumberInput
                    label="Процент коррекции конверсии сайта"
                    value={conversionCorrection}
                    step={1}
                    onChange={(value) => setConversionCorrection(Math.min(100, Math.max(1, Math.round(value || 1))))}
                  />
                  <span>%</span>
                </span>
              </label>
              <label className={`period-correction-toggle ${includeConversionCorrection ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={includeConversionCorrection}
                  onChange={(event) => setIncludeConversionCorrection(event.target.checked)}
                />
                <span>Учитывать</span>
              </label>
            </div>
          </section>
          {includeDealCycle ? (
            <>
              <div className="result-section-heading">
                <span className="step">Результат в выбранном периоде</span>
                <small>Сделки, которые успеют завершиться с учётом цикла сделки</small>
              </div>
              <div className="metric-grid period-result-grid">
                <Metric label="Лиды" value={qty.format(result.leads)} />
                <Metric label="CPL" value={money(result.cpl)} />
                <Metric label="Завершённые сделки" value={qty.format(result.periodSales)} />
                <Metric label="Выручка в периоде" value={money(result.periodRevenue)} />
                <Metric label="Сделки в работе" value={qty.format(result.salesInWork)} />
                <Metric label="Выручка в работе" value={money(result.revenueInWork)} />
                <Metric label="ROI в периоде" value={`${result.periodRoi >= 0 ? "+" : ""}${qty.format(result.periodRoi)}%`} accent={result.periodRoi >= 0 ? "green" : "coral"} />
              </div>
              <section className="potential-result">
                <div className="result-section-heading">
                  <span className="step">Потенциальный результат</span>
                  <small>Итог по всем лидам после полного прохождения цикла сделки</small>
                </div>
                <div className="potential-grid">
                  <Metric label="Ожидаемые сделки" value={qty.format(result.sales)} />
                  <Metric label="Ожидаемая выручка" value={money(result.revenue)} />
                  <Metric label="Ожидаемая прибыль" value={money(result.grossMargin - result.totalExpenses)} />
                  <Metric label="Прогнозный ROI" value={`${result.roi >= 0 ? "+" : ""}${qty.format(result.roi)}%`} accent={positive ? "green" : "coral"} />
                </div>
                <p>Все лиды, полученные за расчётный период, ориентировочно закроются к <b>{finalEvaluationDate}</b>.</p>
              </section>
            </>
          ) : (
            <>
              <div className="result-section-heading">
                <span className="step">Результат в выбранном периоде</span>
                <small>Ожидаемые результаты без учета цикла сделки</small>
              </div>
              <div className="metric-grid period-result-grid">
                <Metric label="Лиды" value={qty.format(result.leads)} />
                <Metric label="CPL" value={money(result.cpl)} />
                <Metric label="Клиенты" value={qty.format(result.clients)} />
                <Metric label="CAC" value={money(result.cac)} />
                {inputs.repeatSales > 1 && <Metric label="Продажи" value={qty.format(result.sales)} />}
                {inputs.repeatSales > 1 && <Metric label="CPO" value={money(result.cpo)} />}
                <Metric label="Выручка" value={money(result.revenue)} />
                <Metric label="Доход" value={money(result.grossMargin)} />
                <Metric label="ROI" value={`${result.roi >= 0 ? "+" : ""}${qty.format(result.roi)}%`} accent={positive ? "green" : "coral"} />
                <Metric label="ДРР" value={`${qty.format(result.drr)}%`} accent={positive ? "green" : "coral"} />
                <Metric label="LTV" value={money(result.ltv)} accent={positive ? "green" : "coral"} />
              </div>
            </>
          )}
          <div className={`insight ${positive ? "good" : "bad"}`}>
            <span>{positive ? "↗" : "↓"}</span>
            <div className="insight-copy"><small>Вывод по модели</small><b>{conclusion}</b></div>
            <button className="pdf-button" type="button" onClick={exportPdf} aria-label="Экспортировать расчёт в PDF">
              <span>PDF</span> Экспортировать
            </button>
          </div>
          {includeDealCycle && <p className="formula-note">Цикл сделки влияет только на срок признания сделок и выручки. Итоговая конверсия и потенциальное количество продаж не меняются.</p>}
        </aside>
      </section>

      <section className="break-even">
        <div className="break-even-head">
          <div><span className="step">Точка безубыточности</span></div>
          <p>Минимальные показатели, при которых маржинальный доход покрывает учитываемые расходы.</p>
        </div>
        <div className={`break-even-status ${positive ? "ready" : "short"}`}>
          <span>{positive ? "✓" : "↑"}</span>
          <b>{positive ? "При текущих параметрах модель уже окупается" : `Для окупаемости нужно ещё ${rub.format(additionalSales)} продаж`}</b>
        </div>
        <div className="break-even-grid">
          <article className="threshold-from"><small>Конверсия сайта</small><b>от {qty.format(breakEven.siteConversion)}%</b><span>при текущем CPC и бюджете</span></article>
          <article className="threshold-from"><small>Клиенты</small><b>от {qty.format(breakEven.clients)}</b><span>за расчётный период</span></article>
          <article className="threshold-from"><small>Конверсия в продажу</small><b>от {qty.format(breakEven.salesConversion)}%</b><span>при текущем количестве лидов</span></article>
          <article className="threshold-from"><small>Выручка</small><b>от {money(breakEven.revenue)}</b><span>при текущем чеке и марже</span></article>
          <article className="threshold-to"><small>CPL</small><b>до {money(breakEven.maxCpl)}</b><span>предельная стоимость лида</span></article>
          <article className="threshold-to"><small>CAC</small><b>до {money(breakEven.maxCac)}</b><span>не выше LTV клиента</span></article>
        </div>
        <p className="break-even-note">Рекламный бюджет и включённые прочие расходы учитываются за каждый месяц выбранного периода.</p>
      </section>

      <section className="metrics-guide">
        <button
          className="accordion-head guide-head"
          type="button"
          aria-expanded={metricsGuideOpen}
          aria-controls="metrics-guide-content"
          onClick={() => setMetricsGuideOpen((open) => !open)}
        >
          <span className="step">Как считаются показатели</span>
          <span className="accordion-icon" aria-hidden="true">{metricsGuideOpen ? "−" : "+"}</span>
        </button>
        {metricsGuideOpen && (
          <div className="guide-grid" id="metrics-guide-content">
            {metricGuide.map((metric, index) => (
              <article className="guide-card" key={metric.name}>
                <div className="guide-title"><span>{String(index + 1).padStart(2, "0")}</span><h2>{metric.name}</h2></div>
                <p>{metric.description}</p>
                <div className="guide-formula"><small>Формула</small><b>{metric.formula}</b></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="calculation-logic">
        <button
          className="accordion-head logic-head"
          type="button"
          aria-expanded={calculationLogicOpen}
          aria-controls="calculation-logic-content"
          onClick={() => setCalculationLogicOpen((open) => !open)}
        >
          <span className="step">Логика расчёта</span>
          <span className="accordion-icon" aria-hidden="true">{calculationLogicOpen ? "−" : "+"}</span>
        </button>
        {calculationLogicOpen && <div className="logic-sections" id="calculation-logic-content">
          <article className="logic-card">
            <div className="logic-copy">
              <div className="guide-title"><span>01</span><h2>Клиенты и продажи</h2></div>
              <p>
                Клиенты рассчитываются для каждого месяца отдельно: если включена квалификация, лиды сначала умножаются
                на её процент, затем к квалифицированным лидам применяется конверсия отдела продаж.
                Поле «Продаж на клиента за год» включает первую и повторные покупки. Первая покупка учитывается сразу,
                а остальные равномерно распределяются на следующие 12 месяцев.
              </p>
              <div className="logic-formulas">
                <div><small>Клиенты месяца</small><b>Лиды месяца × квалификация (если включена) × конверсия отдела продаж</b></div>
                <div><small>Продажи клиента за период</small><b>1 + (продаж в год − 1) ÷ 12 × число оставшихся месяцев</b></div>
                <div><small>Все продажи</small><b>Сумма продаж всех месячных групп клиентов</b></div>
              </div>
            </div>
            <div className="logic-example">
              <span className="step">Пример расчёта</span>
              <h3>10 новых клиентов в месяц, период 3 месяца, 10 продаж на клиента в год</h3>
              <div className="example-rows">
                <div><span>Клиенты 1-го месяца</span><b>10 × 2,5 = 25 продаж</b></div>
                <div><span>Клиенты 2-го месяца</span><b>10 × 1,75 = 17,5 продаж</b></div>
                <div><span>Клиенты 3-го месяца</span><b>10 × 1 = 10 продаж</b></div>
              </div>
              <div className="example-total"><span>Итого за 3 месяца</span><b>30 клиентов · 52,5 продажи</b></div>
              <p>Клиенты последнего месяца совершают только первую покупку. Все 10 годовых продаж не переносятся в короткий период.</p>
            </div>
          </article>

          <article className="logic-card">
            <div className="logic-copy">
              <div className="guide-title"><span>02</span><h2>Процент коррекции</h2></div>
              <p>
                Процент коррекции постепенно увеличивает конверсию сайта в течение выбранного периода. В первом месяце
                применяется только часть указанного процента, а к последнему месяцу — весь процент коррекции.
              </p>
              <div className="logic-formulas">
                <div><small>Коррекция месяца</small><b>% коррекции × номер месяца ÷ период расчёта</b></div>
                <div><small>Конверсия месяца</small><b>Базовая конверсия × (1 + коррекция месяца ÷ 100)</b></div>
              </div>
            </div>
            <div className="logic-example">
              <span className="step">Пример расчёта</span>
              <h3>Период 3 месяца, базовая конверсия сайта 5%, коррекция 6%</h3>
              <div className="example-rows">
                <div><span>1-й месяц</span><b>+2% · конверсия 5,10%</b></div>
                <div><span>2-й месяц</span><b>+4% · конверсия 5,20%</b></div>
                <div><span>3-й месяц</span><b>+6% · конверсия 5,30%</b></div>
              </div>
              <p>Коррекция изменяет саму конверсию относительно базового значения, а не прибавляет процентные пункты.</p>
            </div>
          </article>

          <article className="logic-card">
            <div className="logic-copy">
              <div className="guide-title"><span>03</span><h2>Прочие расходы</h2></div>
              <p>
                Поле задаёт сумму прочих расходов за один месяц. Если учёт включён, расходы начисляются за каждый месяц
                выбранного периода и добавляются к рекламному бюджету при расчёте CPL, CAC, CPO, ROI и ДРР.
              </p>
              <div className="logic-formulas">
                <div><small>Прочие расходы за период</small><b>Прочие расходы в месяц × период расчёта</b></div>
                <div><small>Все учитываемые расходы</small><b>Рекламный бюджет за период + прочие расходы за период</b></div>
              </div>
            </div>
            <div className="logic-example">
              <span className="step">Пример расчёта</span>
              <h3>20 000 ₽ прочих расходов в месяц, период 6 месяцев</h3>
              <div className="example-rows">
                <div><span>Расходы за один месяц</span><b>20 000 ₽</b></div>
                <div><span>Количество месяцев</span><b>6</b></div>
              </div>
              <div className="example-total"><span>Прочие расходы за период</span><b>120 000 ₽</b></div>
              <p>Если переключатель «Учитывать» выключен, прочие расходы не участвуют в расчёте.</p>
            </div>
          </article>

          <article className="logic-card">
            <div className="logic-copy">
              <div className="guide-title"><span>04</span><h2>LTV за выбранный период</h2></div>
              <p>
                LTV показывает средний маржинальный доход от одного клиента в пределах выбранного периода.
                Для расчёта все продажи за период делятся на всех привлечённых клиентов, поэтому учитывается,
                сколько первых и повторных покупок в среднем успевает совершить один клиент.
              </p>
              <div className="logic-formulas">
                <div><small>Продаж на одного клиента за период</small><b>Все продажи за период ÷ все клиенты за период</b></div>
                <div><small>LTV за период</small><b>Средний чек × маржа, % ÷ 100 × продажи на одного клиента за период</b></div>
              </div>
            </div>
            <div className="logic-example">
              <span className="step">Пример расчёта</span>
              <h3>30 клиентов, 52,5 продажи, средний чек 5 000 ₽, маржа 40%</h3>
              <div className="example-rows">
                <div><span>Продаж на одного клиента</span><b>52,5 ÷ 30 = 1,75</b></div>
                <div><span>Маржинальный доход с продажи</span><b>5 000 ₽ × 40% = 2 000 ₽</b></div>
              </div>
              <div className="example-total"><span>LTV за выбранные 3 месяца</span><b>2 000 ₽ × 1,75 = 3 500 ₽</b></div>
              <p>При изменении периода LTV пересчитывается: годовое количество покупок больше не переносится целиком в короткий период.</p>
            </div>
          </article>
        </div>}
      </section>

      {exportModalOpen && (
        <div className="export-modal-backdrop" role="presentation" onMouseDown={() => setExportModalOpen(false)}>
          <section
            className="export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="export-modal-close" type="button" aria-label="Закрыть" onClick={() => setExportModalOpen(false)}>×</button>
            <span className="step">Экспорт в PDF</span>
            <h2 id="export-modal-title">Для какой компании подготовлен расчёт?</h2>
            <p>Название появится в заголовке PDF-отчёта.</p>
            <form onSubmit={confirmExport}>
              <label className="export-company-field">
                <span>Название компании</span>
                <input
                  autoFocus
                  required
                  value={companyNameDraft}
                  onChange={(event) => setCompanyNameDraft(event.target.value)}
                  placeholder="Например, BrickStone"
                />
              </label>
              <div className="export-modal-actions">
                <button className="export-cancel" type="button" onClick={() => setExportModalOpen(false)}>Отмена</button>
                <button className="export-confirm" type="submit" disabled={!companyNameDraft.trim()}>Сформировать PDF</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="pdf-report" aria-hidden="true">
        <div className="pdf-header">
          <div className="pdf-logo">
            <Image src={`${basePath}/supplied-logo.webp`} alt="" width={40} height={40} />
            <span suppressHydrationWarning>{printDate}</span>
          </div>
          <div className="pdf-brand">
            <b>Расчёт юнит-экономики для компании «{companyName}»</b>
          </div>
        </div>
        <div className="pdf-title">
          <span>Выбранная модель</span>
          <h1>{modelName}</h1>
          <p>{includeOtherExpenses ? "В расчёте учтены рекламный бюджет и прочие расходы" : "В расчёте учтён рекламный бюджет"}</p>
        </div>
        <div className="pdf-section">
          <h2>Исходные параметры</h2>
          <div className="pdf-grid pdf-inputs">
            <article><small>Средний чек</small><b>{money(inputs.averageCheck)}</b></article>
            <article><small>Средняя маржа</small><b>{qty.format(inputs.marginPercent)}%</b></article>
            <article><small>Продаж на клиента</small><b>{qty.format(inputs.repeatSales)} в год</b></article>
            <article><small>Средний цикл сделки</small><b>{includeDealCycle ? `${dealCycle} мес.` : "Не учитывается"}</b></article>
            <article><small>Рекламный бюджет</small><b>{money(inputs.budget)}</b></article>
            <article><small>Прочие расходы</small><b>{includeOtherExpenses ? `${money(inputs.otherExpenses)} в месяц` : "Не учитываются"}</b></article>
            <article><small>Средняя цена клика</small><b>{money(inputs.cpc)}</b></article>
            <article><small>Конверсия сайта</small><b>{qty.format(inputs.leadConversion)}%</b></article>
            {model !== "store" && <article><small>Квалификация</small><b>{includeQualification ? `${qty.format(qualification)}%` : "Не учитывается"}</b></article>}
            <article><small>Конверсия в продажу</small><b>{qty.format(inputs.salesConversion)}%</b></article>
            <article><small>Период расчёта</small><b>{calculationPeriod} мес.</b></article>
            <article><small>Коррекция конверсии</small><b>{includeConversionCorrection ? `${conversionCorrection}% за период` : "Не учитывается"}</b></article>
          </div>
        </div>
        <div className="pdf-section">
          <h2>Воронка привлечения</h2>
          <div className={`pdf-funnel ${qualificationEnabled ? "pdf-funnel-qualified" : ""}`}>
            <div><b>{qty.format(result.clicks)}</b><small>Клики</small></div><span>→</span>
            <div><b>{qty.format(result.leads)}</b><small>Лиды</small></div><span>→</span>
            {qualificationEnabled && <><div><b>{qty.format(result.qualifiedLeads)}</b><small>Квалифицированные лиды</small></div><span>→</span></>}
            <div><b>{qty.format(result.clients)}</b><small>Клиенты</small></div><span>→</span>
            <div><b>{qty.format(result.sales)}</b><small>Продажи</small></div>
          </div>
        </div>
        {includeDealCycle ? (
          <>
            <div className="pdf-section">
              <h2>Результат в выбранном периоде</h2>
              <div className="pdf-grid pdf-metrics">
                <article><small>CPL</small><b>{money(result.cpl)}</b></article>
                <article><small>Завершённые сделки</small><b>{qty.format(result.periodSales)}</b></article>
                <article><small>Сделки в работе</small><b>{qty.format(result.salesInWork)}</b></article>
                <article><small>Выручка в периоде</small><b>{money(result.periodRevenue)}</b></article>
                <article><small>Выручка в работе</small><b>{money(result.revenueInWork)}</b></article>
                <article className="pdf-accent"><small>ROI в периоде</small><b>{result.periodRoi >= 0 ? "+" : ""}{qty.format(result.periodRoi)}%</b></article>
              </div>
            </div>
            <div className="pdf-section">
              <h2>Потенциальный результат</h2>
              <div className="pdf-grid pdf-metrics">
                <article><small>Ожидаемые сделки</small><b>{qty.format(result.sales)}</b></article>
                <article><small>Ожидаемая выручка</small><b>{money(result.revenue)}</b></article>
                <article><small>Ожидаемая прибыль</small><b>{money(result.grossMargin - result.totalExpenses)}</b></article>
                <article className="pdf-accent"><small>Прогнозный ROI</small><b>{result.roi >= 0 ? "+" : ""}{qty.format(result.roi)}%</b></article>
              </div>
            </div>
          </>
        ) : (
          <div className="pdf-section">
            <h2>Результат в выбранном периоде</h2>
            <p className="pdf-section-subtitle">Ожидаемые результаты без учета цикла сделки</p>
            <div className="pdf-grid pdf-metrics">
              <article><small>CPL</small><b>{money(result.cpl)}</b></article>
              <article><small>CAC</small><b>{money(result.cac)}</b></article>
              {inputs.repeatSales > 1 && <article><small>CPO</small><b>{money(result.cpo)}</b></article>}
              <article><small>Выручка</small><b>{money(result.revenue)}</b></article>
              <article><small>Доход</small><b>{money(result.grossMargin)}</b></article>
              <article className="pdf-accent"><small>ROI</small><b>{result.roi >= 0 ? "+" : ""}{qty.format(result.roi)}%</b></article>
              <article><small>ДРР</small><b>{qty.format(result.drr)}%</b></article>
              <article><small>LTV</small><b>{money(result.ltv)}</b></article>
            </div>
          </div>
        )}
        <div className={`pdf-conclusion ${positive ? "positive" : "negative"}`}>
          <small>Вывод по модели</small><b>{conclusion}</b>
        </div>
        <div className="pdf-break-even">
          <h2>Точка безубыточности</h2>
          <p>
            Для покрытия окупаемости модели требуется от <b>{qty.format(breakEven.sales)} продаж</b> и выручка от <b>{money(breakEven.revenue)}</b>.
            {" "}Для этого необходимо выдерживать следующие показатели: Конверсия сайта от <b>{qty.format(breakEven.siteConversion)}%</b>,
            {" "}Конверсия в продажу от <b>{qty.format(breakEven.salesConversion)}%</b>, CPL до <b>{money(breakEven.maxCpl)}</b>.
          </p>
        </div>
        <footer className="pdf-footer">
          <span>Расчёт носит прогнозный характер и зависит от множества факторов, таких как качества трафика, реальных продаж, фактической маржинальности и прочих.</span>
          <b>Юнитка · v37</b>
        </footer>
      </section>
    </main>
  );
}
