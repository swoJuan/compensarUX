using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace Compensar.MedicinaPrepagada.ViewModels;

/// <summary>
/// Estado de la pantalla Agendamiento > Nueva cita (Figma 7249:26353).
/// Los comandos son stubs: conectar a la navegación y servicios reales.
/// </summary>
public class AgendamientoViewModel : INotifyPropertyChanged
{
    public const int MaxCentros = 3;

    private bool _esCentroPropio = true;   // estado por defecto en el diseño
    private bool _esPresencial = true;     // estado por defecto en el diseño
    private string? _especialidad;
    private IReadOnlyList<string> _centros = Array.Empty<string>();

    public bool EsCentroPropio { get => _esCentroPropio; set => Set(ref _esCentroPropio, value); }
    public bool EsPresencial   { get => _esPresencial;   set => Set(ref _esPresencial, value); }

    public string? Especialidad
    {
        get => _especialidad;
        set { if (Set(ref _especialidad, value)) OnPropertyChanged(nameof(EspecialidadTexto)); }
    }
    public string EspecialidadTexto => Especialidad ?? "Ej: Medicina general, pediatría";

    public IReadOnlyList<string> Centros
    {
        get => _centros;
        set { if (Set(ref _centros, value.Take(MaxCentros).ToList())) OnPropertyChanged(nameof(CentrosTexto)); }
    }
    public string CentrosTexto => Centros.Count == 0
        ? $"Selecciona hasta {MaxCentros} centros médicos"
        : string.Join(", ", Centros);

    public ICommand BackCommand { get; }
    public ICommand HomeCommand { get; }
    public ICommand GoToMisCitasCommand { get; }
    public ICommand SeleccionarEspecialidadCommand { get; }
    public ICommand SeleccionarCentrosCommand { get; }
    public ICommand BuscarCommand { get; }

    public AgendamientoViewModel()
    {
        BackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        HomeCommand = new Command(async () => await Shell.Current.GoToAsync("//home"));
        GoToMisCitasCommand = new Command(() => { /* TODO: tab Mis citas */ });
        SeleccionarEspecialidadCommand = new Command(() => { /* TODO: bottom sheet de especialidades */ });
        SeleccionarCentrosCommand = new Command(() => { /* TODO: bottom sheet multiselección (máx. 3) */ });
        BuscarCommand = new Command(() => { /* TODO: buscar disponibilidad */ }, () => true);
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged([CallerMemberName] string? n = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
    private bool Set<T>(ref T field, T value, [CallerMemberName] string? n = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value; OnPropertyChanged(n); return true;
    }
}
