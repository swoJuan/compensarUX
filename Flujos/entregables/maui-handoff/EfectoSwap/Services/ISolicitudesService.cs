// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
using Compensar.MedicinaPrepagada.Models;

namespace Compensar.MedicinaPrepagada.Services;

/// <summary>Tanda de solicitudes más el total disponible (el Figma muestra «Mostrando 7 de 18»).</summary>
public sealed record PaginaSolicitudes(IReadOnlyList<Solicitud> Items, int Total);

/// <summary>
/// Contrato mínimo que necesita la pantalla. El contrato real (paginación por offset, cursor, tamaño de página)
/// no está definido en las fuentes de UX: HU-303 «Implementar paginación infinita» es solo referencia.
/// </summary>
public interface ISolicitudesService
{
    Task<PaginaSolicitudes> ObtenerAsync(int desde, int cantidad, CancellationToken cancelar = default);
}

/// <summary>Anuncios para lectores de pantalla (carga, éxito, error, fin). Envuelve SemanticScreenReader para poder probar el ViewModel.</summary>
public interface IAnuncios
{
    void Anunciar(string mensaje);
}

public sealed class AnunciosSemanticScreenReader : IAnuncios
{
    // SemanticScreenReader.Announce: Microsoft.Maui.Accessibility (.NET MAUI).
    public void Anunciar(string mensaje) => SemanticScreenReader.Default.Announce(mensaje);
}
