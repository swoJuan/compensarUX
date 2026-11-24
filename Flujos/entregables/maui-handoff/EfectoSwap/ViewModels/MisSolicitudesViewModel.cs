// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
// Lógica equivalente a Flujos/prototipos/app/efecto-swap/js/swap-app.js (skeleton de primera carga, vacío, tandas 7 → 14 → 18, datos ficticios).
// Expone el estado COMPLETO del control Controls/CargaInfinitaView: PrimeraCarga · Reposo · Cargando · Error · Fin · Vacio.
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using Compensar.MedicinaPrepagada.Controls;
using Compensar.MedicinaPrepagada.Models;
using Compensar.MedicinaPrepagada.Services;

namespace Compensar.MedicinaPrepagada.ViewModels;

public class MisSolicitudesViewModel : INotifyPropertyChanged
{
    /// <summary>Solicitudes por tanda (Figma: «Mostrando 7 de 18»). Con 18 en total las tandas son 7, 7 y 4.</summary>
    public const int TamanoTanda = 7;

    private readonly ISolicitudesService _servicio;
    private readonly IAnuncios _anuncios;
    private EstadoCargaInfinita _estado = EstadoCargaInfinita.PrimeraCarga;
    private bool _primeraCargaHecha;
    private int _total;

    public MisSolicitudesViewModel(ISolicitudesService servicio, IAnuncios anuncios, IPreferenciasMovimiento movimiento)
    {
        _servicio = servicio;
        _anuncios = anuncios;
        ReducirMovimiento = movimiento.ReducirMovimiento;

        // Botón «Cargar más solicitudes»: alternativa accesible al swipe y reintento tras error. El control también lo ejecuta
        // al llegar al final de la lista, pero solo en Reposo (PI-SWAP-05: tras un error no reintenta por gesto).
        // Si la primera carga falló (lista vacía), reintentar repite la primera carga.
        CargarMasCommand = new Command(
            async () => await CargarAsync(),
            () => Estado is EstadoCargaInfinita.Reposo or EstadoCargaInfinita.Error);

        DescargarCommand = new Command<Solicitud>(s => { /* TODO: descarga real de la historia clínica (Solicitud.Radicado) */ });
        VolverCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        NotificacionesCommand = new Command(() => { /* [PENDIENTE] destino no definido en Figma ni en la HU */ });
        NuevaSolicitudCommand = new Command(async () => { /* TODO: navegar al flujo «Nueva solicitud» (Historia clínica) */ await Task.CompletedTask; });
    }

    public ObservableCollection<Solicitud> Solicitudes { get; } = new();

    /// <summary>Estado completo del control de carga infinita (incluye PrimeraCarga y Vacio).</summary>
    public EstadoCargaInfinita Estado
    {
        get => _estado;
        private set
        {
            if (_estado == value) return;
            _estado = value;
            OnPropertyChanged();
            ((Command)CargarMasCommand).ChangeCanExecute();
        }
    }

    public int Total
    {
        get => _total;
        private set { if (_total != value) { _total = value; OnPropertyChanged(); OnPropertyChanged(nameof(TextoContador)); } }
    }

    /// <summary>Preferencia del sistema; el control detiene el pulso del skeleton si es true.</summary>
    public bool ReducirMovimiento { get; }

    public string TextoContador => $"Mostrando {Solicitudes.Count} de {Total} solicitudes";

    public ICommand CargarMasCommand { get; }
    public ICommand DescargarCommand { get; }
    public ICommand VolverCommand { get; }
    public ICommand NotificacionesCommand { get; }
    public ICommand NuevaSolicitudCommand { get; }

    /// <summary>Llamar desde OnAppearing. Muestra el skeleton (primera carga) y luego la primera tanda o el vacío.</summary>
    public async Task InicializarAsync()
    {
        if (!_primeraCargaHecha && Estado == EstadoCargaInfinita.PrimeraCarga) await CargarAsync();
    }

    private Task CargarAsync() => _primeraCargaHecha ? CargarMasAsync() : CargarPrimeraAsync();

    /// <summary>Primera carga: skeleton → (7 solicitudes | vacío). Figma 8954:26839 y 8954:26680. Sin diseño propio para el fallo de esta carga.</summary>
    private async Task CargarPrimeraAsync()
    {
        Estado = EstadoCargaInfinita.PrimeraCarga;
        _anuncios.Anunciar("Cargando solicitudes…");   // el skeleton va oculto a lectores de pantalla; el anuncio lo reemplaza
        try
        {
            var pagina = await _servicio.ObtenerAsync(0, TamanoTanda);
            Total = pagina.Total;
            _primeraCargaHecha = true;
            if (pagina.Items.Count == 0)
            {
                Estado = EstadoCargaInfinita.Vacio;
                _anuncios.Anunciar("Aún no tienes solicitudes.");
                return;
            }
            foreach (var s in pagina.Items) Solicitudes.Add(s);
            OnPropertyChanged(nameof(TextoContador));
            var terminado = Solicitudes.Count >= Total;
            Estado = terminado ? EstadoCargaInfinita.Fin : EstadoCargaInfinita.Reposo;
            _anuncios.Anunciar($"Se cargaron {pagina.Items.Count} solicitudes. {TextoContador}." + (terminado ? " No hay más solicitudes para mostrar." : ""));
        }
        catch (Exception)   // [SUPUESTO] cualquier fallo se trata igual
        {
            // Figma no diseña el error de la primera carga: se reutiliza la alerta del pie con el botón de reintento (que repite la primera carga).
            Estado = EstadoCargaInfinita.Error;
            _anuncios.Anunciar("No pudimos cargar tus solicitudes. Revisa tu conexión e inténtalo más tarde. Puedes volver a intentarlo con el botón Cargar más solicitudes.");
        }
    }

    private async Task CargarMasAsync()
    {
        if (Estado is EstadoCargaInfinita.Cargando or EstadoCargaInfinita.Fin) return;

        Estado = EstadoCargaInfinita.Cargando;
        _anuncios.Anunciar("Cargando más solicitudes…");
        try
        {
            var pagina = await _servicio.ObtenerAsync(Solicitudes.Count, TamanoTanda);
            foreach (var s in pagina.Items) Solicitudes.Add(s);   // se AGREGA debajo de las anteriores, no reemplaza
            Total = pagina.Total;
            OnPropertyChanged(nameof(TextoContador));

            var terminado = Solicitudes.Count >= Total || pagina.Items.Count == 0;   // sin items = nada más que cargar (evita bucles)
            Estado = terminado ? EstadoCargaInfinita.Fin : EstadoCargaInfinita.Reposo;

            var cargadas = $"Se cargaron {pagina.Items.Count} solicitudes más. {TextoContador}.";
            _anuncios.Anunciar(terminado ? $"{cargadas} No hay más solicitudes para mostrar." : cargadas);
        }
        catch (Exception)   // [SUPUESTO] cualquier fallo de red/servicio se trata igual; ajustar a las excepciones reales del servicio
        {
            Estado = EstadoCargaInfinita.Error;
            _anuncios.Anunciar("No pudimos cargar más solicitudes. Revisa tu conexión e inténtalo más tarde. Puedes volver a intentarlo con el botón Cargar más solicitudes.");
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged([CallerMemberName] string? n = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
}
