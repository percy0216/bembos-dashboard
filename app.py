import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(
    page_title="Concurso Producción Bembos HCO",
    page_icon="🍔",
    layout="centered",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    .block-container { padding-top: 1.5rem; padding-bottom: 2rem; }
    h1 { font-size: 1.4rem !important; }
    h2 { font-size: 1.1rem !important; }
    .stTabs [data-baseweb="tab"] { font-size: 0.85rem; }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    df = pd.read_csv("total_tiempos_completo.csv")
    df.columns = df.columns.str.strip()
    df["Tiempo (min)"] = pd.to_numeric(df["Tiempo (min)"], errors="coerce")
    df["Fecha"] = pd.to_datetime(df["Fecha"], dayfirst=True, errors="coerce")
    df["Hora Inicio"] = pd.to_datetime(df["Hora Inicio"], format="%H:%M", errors="coerce").dt.time
    df["Hora"] = pd.to_datetime(df["Hora Inicio"].astype(str), format="%H:%M:%S", errors="coerce").dt.strftime("%I:00 %p")
    df = df.dropna(subset=["Tiempo (min)"])
    return df

df = load_data()

BEMBOS_RED = "#E31837"
COLORS = ["#E31837", "#FF6B35", "#FFB347", "#4A90D9", "#7B68EE"]

st.markdown(f"<h1 style='color:{BEMBOS_RED}'>🍔 Concurso de Producción<br>Bembos HCO</h1>", unsafe_allow_html=True)
st.markdown("---")

tab1, tab2, tab3, tab4 = st.tabs(["🏆 Ganador", "📊 Por Estación", "⏱ Por Hora", "📋 Historial"])

# ── TAB 1: GANADOR (solo PLANCHA, menor promedio gana) ──
with tab1:
    st.markdown("#### 🏆 Ganador del Concurso de Plancha")
    st.caption("Menor tiempo promedio = mejor rendimiento")

    plancha_df = df[df["Estacion"] == "PLANCHA"]
    ranking = (
        plancha_df.groupby("Colaborador")["Tiempo (min)"]
        .mean()
        .round(2)
        .reset_index()
        .sort_values("Tiempo (min)")
    )

    ganador = ranking.iloc[0]
    st.success(f"🥇 **{ganador['Colaborador']}** — Promedio: **{ganador['Tiempo (min)']} min**")

    fig1 = go.Figure(go.Bar(
        x=ranking["Tiempo (min)"],
        y=ranking["Colaborador"],
        orientation="h",
        marker=dict(
            color=[BEMBOS_RED if i == 0 else "#CCCCCC" for i in range(len(ranking))],
        ),
        text=ranking["Tiempo (min)"].apply(lambda x: f"{x:.2f}"),
        textposition="outside",
    ))
    fig1.update_layout(
        xaxis_title="Promedio de Tiempo (min)",
        yaxis=dict(autorange="reversed"),
        margin=dict(l=10, r=40, t=10, b=30),
        height=300,
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    fig1.update_xaxes(range=[0, ranking["Tiempo (min)"].max() * 1.2])
    st.plotly_chart(fig1, use_container_width=True)

# ── TAB 2: POR ESTACIÓN ──
with tab2:
    st.markdown("#### Promedio por Colaborador y Estación")

    grouped = (
        df.groupby(["Colaborador", "Estacion"])["Tiempo (min)"]
        .mean()
        .round(2)
        .reset_index()
    )

    fig2 = px.bar(
        grouped,
        x="Colaborador",
        y="Tiempo (min)",
        color="Estacion",
        barmode="group",
        color_discrete_map={"PLANCHA": BEMBOS_RED, "PACKER": "#4A90D9"},
        text="Tiempo (min)",
    )
    fig2.update_traces(texttemplate="%{text:.2f}", textposition="outside")
    fig2.update_layout(
        yaxis_title="Promedio de Tiempo (min)",
        xaxis_title="Colaborador",
        legend_title="Estación",
        margin=dict(l=10, r=10, t=10, b=30),
        height=350,
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    st.plotly_chart(fig2, use_container_width=True)

# ── TAB 3: POR HORA ──
with tab3:
    st.markdown("#### Promedio de Tiempo por Hora")

    hora_df = (
        df.groupby("Hora")["Tiempo (min)"]
        .mean()
        .round(2)
        .reset_index()
        .sort_values("Hora")
    )

    fig3 = px.line(
        hora_df,
        x="Hora",
        y="Tiempo (min)",
        markers=True,
        color_discrete_sequence=[BEMBOS_RED],
    )
    fig3.update_traces(marker=dict(size=8))
    fig3.update_layout(
        yaxis_title="Promedio de Tiempo (min)",
        xaxis_title="Hora",
        margin=dict(l=10, r=10, t=10, b=30),
        height=320,
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    st.plotly_chart(fig3, use_container_width=True)

# ── TAB 4: HISTORIAL PERSONAL ──
with tab4:
    st.markdown("#### Mi historial de pedidos")

    col1, col2 = st.columns(2)
    with col1:
        colaborador = st.selectbox("Colaborador", sorted(df["Colaborador"].unique()))
    with col2:
        estaciones = df[df["Colaborador"] == colaborador]["Estacion"].unique()
        estacion = st.selectbox("Estación", sorted(estaciones))

    filtrado = df[
        (df["Colaborador"] == colaborador) & (df["Estacion"] == estacion)
    ].copy()

    if filtrado.empty:
        st.info("No hay registros para esta combinación.")
    else:
        filtrado_sorted = filtrado.sort_values(["Fecha", "Hora Inicio"])

        prom = filtrado_sorted["Tiempo (min)"].mean()
        total = len(filtrado_sorted)
        mejor = filtrado_sorted["Tiempo (min)"].min()

        m1, m2, m3 = st.columns(3)
        m1.metric("Promedio", f"{prom:.2f} min")
        m2.metric("Total pedidos", total)
        m3.metric("Mejor tiempo", f"{mejor} min")

        st.markdown("**Detalle de registros:**")

        tabla = filtrado_sorted[["Fecha", "Hora Inicio", "Hora Fin", "Tiempo (min)"]].copy()
        tabla["Fecha"] = tabla["Fecha"].dt.strftime("%d/%m/%Y")
        tabla["Hora Inicio"] = tabla["Hora Inicio"].astype(str).str[:5]
        tabla["Hora Fin"] = tabla["Hora Fin"].astype(str).str[:5]
        tabla = tabla.rename(columns={"Tiempo (min)": "Tiempo (min) ⏱"})
        tabla = tabla.reset_index(drop=True)
        tabla.index += 1

        st.dataframe(tabla, use_container_width=True, height=300)
