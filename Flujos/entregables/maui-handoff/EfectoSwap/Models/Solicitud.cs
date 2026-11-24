// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
namespace Compensar.MedicinaPrepagada.Models;

public enum EstadoSolicitud { Radicado, Gestionado, Rechazado }

/// <summary>
/// Solicitud de historia clínica (tarjeta «Solicitud - …» de Figma 8655:24394).
/// Modelo de presentación: reemplazar por el contrato real del servicio cuando exista.
/// </summary>
public sealed record Solicitud(
    string Radicado,
    EstadoSolicitud Estado,
    DateOnly FechaRadicacion,
    string Servicios,
    DateOnly Desde,
    DateOnly Hasta,
    string? MotivoRechazo = null)
{
    private static readonly string[] Meses = { "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic" };

    // Un chip por estado (ver Views/MisSolicitudesPage.xaml): evita triggers sobre enums.
    public bool EsRadicado => Estado == EstadoSolicitud.Radicado;
    public bool EsGestionado => Estado == EstadoSolicitud.Gestionado;
    public bool EsRechazado => Estado == EstadoSolicitud.Rechazado;

    // Figma: «Descargar historia clínica» solo en Gestionado; «Motivo» solo en Rechazado.
    public bool PuedeDescargar => EsGestionado;
    public bool TieneMotivo => EsRechazado && !string.IsNullOrWhiteSpace(MotivoRechazo);

    /// <summary>"28 sep 2026" (Figma). Se formatea a mano: la abreviatura de es-CO cambia según la versión de ICU del dispositivo.</summary>
    public string FechaRadicacionTexto => FormatearFecha(FechaRadicacion);

    /// <summary>"15 ene – 20 sep 2026"; omite el año inicial si coincide con el final (regla del Figma).</summary>
    public string PeriodoTexto =>
        Desde.Year == Hasta.Year
            ? $"{Desde.Day:00} {Meses[Desde.Month - 1]} – {FormatearFecha(Hasta)}"
            : $"{FormatearFecha(Desde)} – {FormatearFecha(Hasta)}";

    // Textos para tecnologías de apoyo (SemanticProperties).
    public string EstadoDescripcion => $"Estado: {Estado}";
    public string DescargaAyuda => $"Solicitud {Radicado}";

    private static string FormatearFecha(DateOnly f) => $"{f.Day:00} {Meses[f.Month - 1]} {f.Year}";
}
