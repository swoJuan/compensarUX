// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
namespace Compensar.MedicinaPrepagada.Controls;

/// <summary>
/// Estados del patrón «carga infinita» del DS (Core-Design-System/docs/app/components/carga-infinita.html). Un solo estado a la vez.
/// Figma (sección Swap 8658:24679): PrimeraCarga 8954:26839 · Reposo 8655:24380 · Cargando 8657:139 · Error 8923:25318 · Fin 8908:24622 · Vacio 8954:26680.
/// </summary>
public enum EstadoCargaInfinita
{
    /// <summary>Primera carga de la pantalla: skeleton en lugar de la lista. Sin pie.</summary>
    PrimeraCarga,
    /// <summary>Lista con registros y más por cargar: indicador del gesto, contador y botón.</summary>
    Reposo,
    /// <summary>Cargando una tanda posterior: spinner + texto; el botón se ve inactivo.</summary>
    Cargando,
    /// <summary>Falló una tanda: alerta de error y botón de reintento. El gesto no reintenta.</summary>
    Error,
    /// <summary>No hay más registros: texto de fin y contador, sin spinner ni botón.</summary>
    Fin,
    /// <summary>La primera carga terminó sin registros: tarjeta de estado vacío. Sin pie.</summary>
    Vacio,
}
