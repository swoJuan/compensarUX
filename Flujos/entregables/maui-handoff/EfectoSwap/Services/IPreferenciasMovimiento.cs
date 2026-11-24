// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
namespace Compensar.MedicinaPrepagada.Services;

/// <summary>
/// Preferencia del sistema «reducir movimiento». MAUI no la expone de forma multiplataforma.
/// Implementación real por plataforma (ver docs/ACCESIBILIDAD.md):
///   iOS: UIKit.UIAccessibility.IsReduceMotionEnabled
///   Android: Settings.Global.GetFloat(ContentResolver, Settings.Global.AnimatorDurationScale, 1f) == 0f
/// </summary>
public interface IPreferenciasMovimiento
{
    bool ReducirMovimiento { get; }
}

/// <summary>Implementación por defecto de la referencia: no detecta nada (devuelve false). Reemplazar por una por plataforma.</summary>
public sealed class PreferenciasMovimientoPorDefecto : IPreferenciasMovimiento
{
    public bool ReducirMovimiento => false;
}
