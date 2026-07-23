"use client";

import { useMemo, useState } from "react";

type Inputs = {
  averageCheck: number;
  marginPercent: number;
  repeatSales: number;
  budget: number;
  cpc: number;
  leadConversion: number;
  salesConversion: number;
};

type ModelKey = "goods" | "services";

const presets: Record<ModelKey, Inputs> = {
  goods: {
    averageCheck: 3500,
    marginPercent: 47,
    repeatSales: 2,
    budget: 150000,
    cpc: 35,
    leadConversion: 3,
    salesConversion: 40,
  },
  services: {
    averageCheck: 6500,
    marginPercent: 46,
    repeatSales: 1,
    budget: 150000,
    cpc: 45,
    leadConversion: 5,
    salesConversion: 40,
  },
};

const metricGuide = [
  { name: "Клики", description: "Прогноз количества переходов на сайт из рекламы.", formula: "Рекламный бюджет ÷ средняя цена клика" },
  { name: "Лиды", description: "Количество посетителей, которые оставят заявку или обратятся в компанию.", formula: "Клики × конверсия сайта ÷ 100" },
  { name: "CPL", description: "Средняя стоимость получения одной заявки.", formula: "Рекламный бюджет ÷ лиды" },
  { name: "Клиенты", description: "Количество лидов, которые совершат покупку.", formula: "Лиды × конверсия отдела продаж ÷ 100" },
  { name: "CAC", description: "Средняя стоимость привлечения одного нового клиента.", formula: "Рекламный бюджет ÷ клиенты" },
  { name: "Продажи", description: "Общее количество покупок с учётом повторных продаж за год.", formula: "Клиенты × продажи на одного клиента за год" },
  { name: "Выручка", description: "Общая сумма продаж до вычета расходов.", formula: "Продажи × средний чек" },
  { name: "Доход", description: "Маржинальный доход, который остаётся после прямых расходов на товары или услуги.", formula: "Выручка × маржа, % ÷ 100" },
  { name: "ROI", description: "Окупаемость рекламных вложений с учётом маржи.", formula: "(Маржинальный доход − рекламный бюджет) ÷ рекламный бюджет × 100%" },
  { name: "LTV", description: "Маржинальный доход, который приносит один клиент за год.", formula: "Средний чек × маржа, % ÷ 100 × продажи на клиента за год" },
];

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

function money(value: number) {
  return `${rub.format(Number.isFinite(value) ? value : 0)} ₽`;
}

function Field({ label, value, suffix, hint, decimals, step, onChange }: { label: string; value: number; suffix: string; hint: string; decimals?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        <span className="tip" tabIndex={0} aria-label={`Подсказка: ${hint}`}>
          ?<span className="tooltip" role="tooltip">{hint}</span>
        </span>
      </span>
      <span className="field-control">
        <input type="number" lang="ru" min="0" step={step ?? (decimals === undefined ? "any" : 1 / (10 ** decimals))} value={decimals === undefined ? value : value.toFixed(decimals)} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} />
        <span>{suffix}</span>
      </span>
    </label>
  );
}

function Metric({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: "green" | "coral" }) {
  return <article className={`metric ${accent ?? ""}`}><span className="metric-icon">{icon}</span><div><small>{label}</small><b>{value}</b></div></article>;
}

export default function Home() {
  const [model, setModel] = useState<ModelKey>("services");
  const [inputs, setInputs] = useState<Inputs>(presets.services);
  const update = (key: keyof Inputs, value: number) => setInputs((current) => ({ ...current, [key]: value }));
  const chooseModel = (key: ModelKey) => {
    setModel(key);
    setInputs(presets[key]);
  };

  const result = useMemo(() => {
    const clicks = inputs.cpc > 0 ? Math.floor(inputs.budget / inputs.cpc) : 0;
    const leads = Math.floor(clicks * inputs.leadConversion / 100);
    const clients = Math.floor(leads * inputs.salesConversion / 100);
    const sales = Math.floor(clients * inputs.repeatSales);
    const revenue = sales * inputs.averageCheck;
    const cpl = leads > 0 ? inputs.budget / leads : 0;
    const cac = clients > 0 ? inputs.budget / clients : 0;
    const marginPerSale = inputs.averageCheck * inputs.marginPercent / 100;
    const ltv = marginPerSale * inputs.repeatSales;
    const grossMargin = sales * marginPerSale;
    const roi = inputs.budget > 0 ? ((grossMargin - inputs.budget) / inputs.budget) * 100 : 0;
    return { clicks, leads, cpl, clients, sales, revenue, cac, ltv, roi, grossMargin };
  }, [inputs]);

  const positive = result.roi >= 0;
  const breakEven = useMemo(() => {
    const marginPerSale = inputs.averageCheck * inputs.marginPercent / 100;
    const sales = marginPerSale > 0 ? Math.ceil(inputs.budget / marginPerSale) : 0;
    const clients = inputs.repeatSales > 0 ? Math.ceil(sales / inputs.repeatSales) : 0;
    const leads = inputs.salesConversion > 0 ? Math.ceil(clients / (inputs.salesConversion / 100)) : 0;
    const revenue = sales * inputs.averageCheck;
    const siteConversion = result.clicks > 0 ? leads / result.clicks * 100 : 0;
    const salesConversion = result.leads > 0 ? clients / result.leads * 100 : 0;
    const maxCpl = result.ltv * inputs.salesConversion / 100;
    return { sales, clients, revenue, siteConversion, salesConversion, maxCpl, maxCac: result.ltv };
  }, [inputs, result.clicks, result.leads, result.ltv]);
  const additionalSales = Math.max(0, breakEven.sales - result.sales);
  const conclusion = positive
    ? `Вложенный рубль приносит ${qty.format(result.roi / 100 + 1)} ₽ маржинального дохода`
    : `Реклама не окупается: не хватает ${money(Math.abs(result.grossMargin - inputs.budget))}`;

  return (
    <main>
      <header className="header" id="top">
        <div className="header-inner">
          <a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /><i /></span><b>Юнитка</b></a>
          <span className="header-title">Юнит-экономика. Универсальный калькулятор</span>
        </div>
      </header>

      <section className="workspace">
        <div className="calculator">
          <section className="preset-section">
            <span className="step">Выберите тип бизнеса</span>
            <div className="preset-grid">
              <button className={`preset ${model === "goods" ? "active" : ""}`} aria-pressed={model === "goods"} onClick={() => chooseModel("goods")}>
                <span className="preset-icon">□</span><span><b>Товары</b><small>Продажа физических товаров</small></span>{model === "goods" && <i>✓</i>}
              </button>
              <button className={`preset ${model === "services" ? "active" : ""}`} aria-pressed={model === "services"} onClick={() => chooseModel("services")}>
                <span className="preset-icon">○</span><span><b>Услуги</b><small>Услуги и консультации</small></span>{model === "services" && <i>✓</i>}
              </button>
            </div>
          </section>
          <section className="input-group">
            <div className="group-head"><span className="group-number">01</span><span className="step">Экономика одной продажи</span></div>
            <div className="fields business-fields">
              <Field label="Средний чек" value={inputs.averageCheck} suffix="₽" hint="Средняя выручка с одной продажи." step={100} onChange={(v) => update("averageCheck", v)} />
              <Field label="Маржа с продажи" value={inputs.marginPercent} suffix="%" hint="Доля среднего чека, которая остаётся после прямых расходов, без учёта рекламы." onChange={(v) => update("marginPercent", v)} />
              <Field label="Продаж на клиента за год" value={inputs.repeatSales} suffix="раз" hint="Среднее число покупок одного клиента за год. Если покупка одна, укажите 1." decimals={1} onChange={(v) => update("repeatSales", v)} />
            </div>
          </section>

          <section className="input-group marketing-group">
            <div className="group-head"><span className="group-number">02</span><span className="step">Воронка привлечения</span></div>
            <div className="fields marketing-fields">
              <Field label="Рекламный бюджет" value={inputs.budget} suffix="₽" hint="Сумма, которую планируете потратить на рекламу за период." step={10000} onChange={(v) => update("budget", v)} />
              <Field label="Средняя цена клика" value={inputs.cpc} suffix="₽" hint="Средняя стоимость одного перехода из рекламы." onChange={(v) => update("cpc", v)} />
              <Field label="Конверсия сайта" value={inputs.leadConversion} suffix="%" hint="Доля посетителей, которые оставили заявку или обратились." decimals={1} onChange={(v) => update("leadConversion", v)} />
              <Field label="Конверсия отдела продаж" value={inputs.salesConversion} suffix="%" hint="Доля лидов, которые стали клиентами и оплатили покупку." onChange={(v) => update("salesConversion", v)} />
            </div>
          </section>
        </div>

        <aside className="results">
          <div className="results-head"><span className="step">Ожидаемый результат</span><span className="live">● Обновляется сразу</span></div>
          <div className="funnel">
            <div><b>{qty.format(result.clicks)}</b><small>кликов</small></div><span>→</span>
            <div><b>{qty.format(result.leads)}</b><small>лидов</small></div><span>→</span>
            <div><b>{qty.format(result.clients)}</b><small>клиентов</small></div><span>→</span>
            <div><b>{qty.format(result.sales)}</b><small>продаж</small></div>
          </div>
          <div className="metric-grid">
            <Metric label="Клики" value={qty.format(result.clicks)} icon="↗" />
            <Metric label="Лиды" value={qty.format(result.leads)} icon="◎" />
            <Metric label="CPL" value={money(result.cpl)} icon="₽" />
            <Metric label="Клиенты" value={qty.format(result.clients)} icon="○" />
            <Metric label="Продажи" value={qty.format(result.sales)} icon="▣" />
            <Metric label="CAC" value={money(result.cac)} icon="◉" />
            <Metric label="Выручка" value={money(result.revenue)} icon="₽" />
            <Metric label="Доход" value={money(result.grossMargin)} icon="≈" />
            <Metric label="ROI" value={`${result.roi >= 0 ? "+" : ""}${qty.format(result.roi)}%`} icon="↗" accent={positive ? "green" : "coral"} />
            <Metric label="LTV" value={money(result.ltv)} icon="↻" />
          </div>
          <div className={`insight ${positive ? "good" : "bad"}`}><span>{positive ? "↗" : "↓"}</span><div><small>Вывод по модели</small><b>{conclusion}</b></div></div>
          <p className="formula-note">ROI рассчитан по маржинальному доходу: (маржа со всех продаж − рекламный бюджет) ÷ рекламный бюджет.</p>
        </aside>
      </section>

      <section className="break-even">
        <div className="break-even-head">
          <div><span className="step">Контрольная точка</span><h2>Точка безубыточности</h2></div>
          <p>Минимальные показатели, при которых маржинальный доход покрывает рекламный бюджет.</p>
        </div>
        <div className={`break-even-status ${positive ? "ready" : "short"}`}>
          <span>{positive ? "✓" : "↑"}</span>
          <b>{positive ? "При текущих параметрах модель уже окупается" : `Для окупаемости нужно ещё ${rub.format(additionalSales)} продаж`}</b>
        </div>
        <div className="break-even-grid">
          <article className="threshold-from"><small>Конверсия сайта</small><b>от {qty.format(breakEven.siteConversion)}%</b><span>при текущем CPC и бюджете</span></article>
          <article className="threshold-from"><small>Клиенты</small><b>от {qty.format(breakEven.clients)}</b><span>за расчётный период</span></article>
          <article className="threshold-from"><small>Конверсия отдела продаж</small><b>от {qty.format(breakEven.salesConversion)}%</b><span>при текущем количестве лидов</span></article>
          <article className="threshold-from"><small>Выручка</small><b>от {money(breakEven.revenue)}</b><span>при текущем чеке и марже</span></article>
          <article className="threshold-to"><small>CPL</small><b>до {money(breakEven.maxCpl)}</b><span>предельная стоимость лида</span></article>
          <article className="threshold-to"><small>CAC</small><b>до {money(breakEven.maxCac)}</b><span>не выше LTV клиента</span></article>
        </div>
        <p className="break-even-note">Расчёт показывает окупаемость рекламного бюджета. Постоянные расходы бизнеса в точку безубыточности не включены.</p>
      </section>

      <section className="metrics-guide">
        <div className="guide-head">
          <span className="step">Как считаются показатели</span>
          <p>Краткие пояснения к результатам калькулятора</p>
        </div>
        <div className="guide-grid">
          {metricGuide.map((metric, index) => (
            <article className="guide-card" key={metric.name}>
              <div className="guide-title"><span>{String(index + 1).padStart(2, "0")}</span><h2>{metric.name}</h2></div>
              <p>{metric.description}</p>
              <div className="guide-formula"><small>Формула</small><b>{metric.formula}</b></div>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
