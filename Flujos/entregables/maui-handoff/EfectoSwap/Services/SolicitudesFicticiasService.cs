// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
// DATOS FICTICIOS: sin personas ni radicados reales. Equivalen a Flujos/prototipos/app/efecto-swap/js/swap-data.js.
using Compensar.MedicinaPrepagada.Models;

namespace Compensar.MedicinaPrepagada.Services;

public sealed class SolicitudesFicticiasService : ISolicitudesService
{
    /// <summary>Espera simulada de red (el prototipo usa 700 ms).</summary>
    public TimeSpan Latencia { get; set; } = TimeSpan.FromMilliseconds(700);

    /// <summary>Espera de la primera carga (el prototipo muestra el skeleton 900 ms).</summary>
    public TimeSpan LatenciaPrimeraCarga { get; set; } = TimeSpan.FromMilliseconds(900);

    /// <summary>Si es true, el servicio devuelve 0 solicitudes (equivale a ?vacio=1 del prototipo) y la pantalla muestra el estado vacío.</summary>
    public bool SinRegistros { get; set; }

    /// <summary>Si es true, la PRÓXIMA llamada lanza una excepción (y vuelve a false). Sirve para probar el estado de error.</summary>
    public bool FallarProximaVez { get; set; }

    // Registros 1–7: tomados de Figma 8655:24380. Registros 8–18: SUPUESTO ficticio para completar las 18 del contador «Mostrando 7 de 18».
    // «Motivo del rechazo» es el placeholder {Motivo del rechazo} en Figma: el texto de abajo es ficticio hasta que negocio defina los reales.
    private const string Motivo1 = "No encontramos atenciones registradas para los servicios y el periodo seleccionados.";
    private const string Motivo2 = "El periodo solicitado no corresponde a atenciones en una IPS Compensar.";

    private static readonly Solicitud[] Todas =
    {
        S("123456789", EstadoSolicitud.Radicado,   "2026-09-28", "Medicina general, Dermatología, Cirugía", "2026-01-15", "2026-09-20"),
        S("987654321", EstadoSolicitud.Gestionado, "2026-08-10", "Medicina general",                        "2026-01-15", "2026-09-20"),
        S("987654322", EstadoSolicitud.Rechazado,  "2026-08-10", "Medicina especializada, Urgencias",       "2025-01-01", "2026-07-31", Motivo1),
        S("987654323", EstadoSolicitud.Gestionado, "2026-07-22", "Pediatría",                               "2026-01-01", "2026-06-30"),
        S("123456790", EstadoSolicitud.Radicado,   "2026-07-03", "Medicina general, Dermatología, Cirugía", "2026-03-01", "2026-06-30"),
        S("987654324", EstadoSolicitud.Gestionado, "2026-06-18", "Ortopedia",                               "2026-01-01", "2026-05-31"),
        S("987654325", EstadoSolicitud.Rechazado,  "2026-05-02", "Medicina especializada, Urgencias",       "2025-01-01", "2026-04-30", Motivo2),
        // ── SUPUESTO 8–18 ──
        S("987654326", EstadoSolicitud.Gestionado, "2026-04-15", "Nutrición",                               "2025-10-01", "2026-03-31"),
        S("987654327", EstadoSolicitud.Gestionado, "2026-03-27", "Odontología, Enfermería",                 "2025-09-01", "2026-02-28"),
        S("123456791", EstadoSolicitud.Radicado,   "2026-03-09", "Psicología",                              "2025-11-01", "2026-02-28"),
        S("987654328", EstadoSolicitud.Rechazado,  "2026-02-20", "Terapias",                                "2024-01-01", "2026-01-31", Motivo1),
        S("987654329", EstadoSolicitud.Gestionado, "2026-02-04", "Medicina general",                        "2025-07-01", "2025-12-31"),
        S("987654330", EstadoSolicitud.Gestionado, "2026-01-19", "Historia clínica completa",               "2024-01-01", "2025-12-31"),
        S("123456792", EstadoSolicitud.Radicado,   "2025-12-11", "Cirugía, Medicina especializada",         "2025-01-01", "2025-11-30"),
        S("987654331", EstadoSolicitud.Gestionado, "2025-11-26", "Pediatría, Nutrición",                    "2025-05-01", "2025-10-31"),
        S("987654332", EstadoSolicitud.Rechazado,  "2025-10-30", "Urgencias",                               "2023-01-01", "2025-09-30", Motivo2),
        S("987654333", EstadoSolicitud.Gestionado, "2025-10-08", "Medicina general",                        "2025-03-01", "2025-09-30"),
        S("123456793", EstadoSolicitud.Radicado,   "2025-09-16", "Odontología",                             "2025-01-01", "2025-08-31"),
    };

    public async Task<PaginaSolicitudes> ObtenerAsync(int desde, int cantidad, CancellationToken cancelar = default)
    {
        await Task.Delay(desde == 0 ? LatenciaPrimeraCarga : Latencia, cancelar);
        if (FallarProximaVez)
        {
            FallarProximaVez = false;
            throw new HttpRequestException("Fallo simulado de red.");
        }
        if (SinRegistros) return new PaginaSolicitudes(Array.Empty<Solicitud>(), 0);
        var items = Todas.Skip(desde).Take(cantidad).ToList();
        return new PaginaSolicitudes(items, Todas.Length);
    }

    private static Solicitud S(string id, EstadoSolicitud e, string f, string serv, string d, string h, string? motivo = null)
        => new(id, e, DateOnly.Parse(f), serv, DateOnly.Parse(d), DateOnly.Parse(h), motivo);
}
