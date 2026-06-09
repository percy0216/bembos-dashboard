import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import {
  rawData, COLABORADORES, ESTACIONES, COLORS,
  getRanking, getByEstacion, getByHora, getHistorial, avg,
} from "./data";
import "./App.css";

const ranking = getRanking();
const byEstacion = getByEstacion();
const byHora = getByHora();

// ── Custom tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value} min</strong>
        </p>
      ))}
    </div>
  );
};

// ── TAB: Ganador ──
function TabGanador() {
  const winner = ranking[0];
  return (
    <div className="tab-content">
      <div className="winner-banner">
        <span className="winner-crown">🥇</span>
        <div>
          <p className="winner-label">Ganador · Estación Plancha</p>
          <p className="winner-name">{winner.colaborador}</p>
          <p className="winner-time">{winner.promedio} min promedio</p>
        </div>
      </div>

      <p className="chart-title">Ranking completo — menor tiempo gana</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={ranking}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" min" />
          <YAxis type="category" dataKey="colaborador" tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="promedio" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#6b7280" }}>
            {ranking.map((entry, i) => (
              <Cell key={entry.colaborador} fill={i === 0 ? COLORS.winner : COLORS.rest} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── TAB: Por Estación ──
function TabEstacion() {
  // Pivot: one row per colaborador with plancha + packer
  const pivot = COLABORADORES.map((c) => {
    const row = { colaborador: c };
    ESTACIONES.forEach((e) => {
      const found = byEstacion.find((d) => d.colaborador === c && d.estacion === e);
      if (found) row[e] = found.promedio;
    });
    return row;
  }).filter((r) => r.PLANCHA || r.PACKER);

  return (
    <div className="tab-content">
      <p className="chart-title">Promedio por colaborador y estación</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={pivot} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
          <XAxis dataKey="colaborador" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" min" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="PLANCHA" fill={COLORS.PLANCHA} radius={[4, 4, 0, 0]} />
          <Bar dataKey="PACKER"  fill={COLORS.PACKER}  radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="stat-grid">
        {byEstacion.map((d) => (
          <div key={d.colaborador + d.estacion} className="stat-card">
            <span className="stat-name">{d.colaborador}</span>
            <span className="stat-badge" style={{ background: d.estacion === "PLANCHA" ? "#fee2e2" : "#fff3e0", color: d.estacion === "PLANCHA" ? "#b91c1c" : "#c2410c" }}>{d.estacion}</span>
            <span className="stat-val">{d.promedio} min</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB: Por Hora ──
function TabHora() {
  return (
    <div className="tab-content">
      <p className="chart-title">Promedio de tiempo por hora del día</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={byHora} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="hora" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" min" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="promedio"
            stroke={COLORS.line}
            strokeWidth={2.5}
            dot={{ r: 5, fill: COLORS.line, strokeWidth: 0 }}
            activeDot={{ r: 7 }}
            name="Promedio"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── TAB: Historial ──
function TabHistorial() {
  const [colaborador, setColaborador] = useState("STEVEN");
  const [estacion, setEstacion] = useState("PLANCHA");

  const estacionesDisp = [...new Set(rawData.filter((d) => d.colaborador === colaborador).map((d) => d.estacion))];
  const efectivaEstacion = estacionesDisp.includes(estacion) ? estacion : estacionesDisp[0] || estacion;

  const historial = getHistorial(colaborador, efectivaEstacion);
  const promedio = historial.length ? +avg(historial.map((d) => d.tiempo)).toFixed(2) : 0;
  const mejor = historial.length ? Math.min(...historial.map((d) => d.tiempo)) : 0;

  return (
    <div className="tab-content">
      <p className="chart-title">Mi historial de pedidos</p>
      <div className="filter-row">
        <select value={colaborador} onChange={(e) => setColaborador(e.target.value)} className="select">
          {COLABORADORES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={efectivaEstacion} onChange={(e) => setEstacion(e.target.value)} className="select">
          {estacionesDisp.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>

      <div className="metrics-row">
        <div className="metric">
          <span className="metric-label">Promedio</span>
          <span className="metric-val">{promedio} <small>min</small></span>
        </div>
        <div className="metric">
          <span className="metric-label">Pedidos</span>
          <span className="metric-val">{historial.length}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Mejor</span>
          <span className="metric-val">{mejor} <small>min</small></span>
        </div>
      </div>

      {historial.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={historial} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis dataKey="horaInicio" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="tiempo" stroke={COLORS.line} strokeWidth={2} dot={{ r: 3, fill: COLORS.line, strokeWidth: 0 }} name="Tiempo" />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="table-wrap">
        <table className="hist-table">
          <thead>
            <tr><th>#</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>min</th></tr>
          </thead>
          <tbody>
            {historial.map((d, i) => (
              <tr key={i} className={d.tiempo <= 5 ? "row-fast" : d.tiempo >= 12 ? "row-slow" : ""}>
                <td>{i + 1}</td>
                <td>{d.fecha.slice(5).replace("-", "/")}</td>
                <td>{d.horaInicio}</td>
                <td>{d.horaFin}</td>
                <td><strong>{d.tiempo}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main App ──
const TABS = [
  { id: "ganador",   label: "🏆 Ganador" },
  { id: "estacion",  label: "📊 Estación" },
  { id: "hora",      label: "⏱ Por hora" },
  { id: "historial", label: "📋 Historial" },
];

export default function App() {
  const [tab, setTab] = useState("ganador");
  return (
    <div className="app">
      <header className="header">
        <div className="logo-row">
          <span className="logo-icon">🍔</span>
          <div>
            <h1 className="logo-title">Concurso de Producción</h1>
            <p className="logo-sub">Bembos Huánuco · Real Plaza</p>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === "ganador"   && <TabGanador />}
        {tab === "estacion"  && <TabEstacion />}
        {tab === "hora"      && <TabHora />}
        {tab === "historial" && <TabHistorial />}
      </main>
    </div>
  );
}
