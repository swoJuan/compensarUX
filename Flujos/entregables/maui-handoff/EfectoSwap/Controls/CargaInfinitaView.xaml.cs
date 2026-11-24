// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado (sin dotnet en el entorno de generación).
using System.Collections;
using System.Windows.Input;

namespace Compensar.MedicinaPrepagada.Controls;

/// <summary>
/// Control reutilizable de carga infinita. No conoce el dominio (solicitudes): la pantalla aporta plantillas y textos.
/// Contrato: <see cref="Estado"/> manda; el control deriva de él qué se ve (skeleton, vacío, lista, pie).
/// El control NO carga datos: ejecuta <see cref="CargarMasCommand"/> (botón del pie y umbral de scroll en Reposo) y el
/// ViewModel de la pantalla cambia el estado y agrega los items a <see cref="ItemsSource"/>.
/// </summary>
public partial class CargaInfinitaView : ContentView
{
    private const string NombreAnimacion = "CargaInfinitaPulso";
    private static readonly object[] UnItem = { "cabecera" };

    // ── Propiedades enlazables ───────────────────────────────────────────────
    public static readonly BindableProperty EstadoProperty = Crear(nameof(Estado), EstadoCargaInfinita.PrimeraCarga, v => v.AlCambiarEstado());
    public static readonly BindableProperty ItemsSourceProperty = Crear<IEnumerable?>(nameof(ItemsSource), null);
    public static readonly BindableProperty ItemTemplateProperty = Crear<DataTemplate?>(nameof(ItemTemplate), null);
    /// <summary>Plantilla de UNA tarjeta skeleton (forma de la tarjeta real). Se repite <see cref="CantidadSkeleton"/> veces.</summary>
    public static readonly BindableProperty SkeletonTemplateProperty = Crear<DataTemplate?>(nameof(SkeletonTemplate), null);
    public static readonly BindableProperty CantidadSkeletonProperty = Crear(nameof(CantidadSkeleton), 3, v => v.OnPropertyChanged(nameof(ItemsSkeleton)));
    /// <summary>Contenido fijo sobre la lista, visible también en skeleton y vacío (p. ej. el aviso de 30 días). Se instancia dos veces.</summary>
    public static readonly BindableProperty CabeceraTemplateProperty = Crear<DataTemplate?>(nameof(CabeceraTemplate), null,
        v => { v.OnPropertyChanged(nameof(Cabecera)); v.OnPropertyChanged(nameof(ItemsCabecera)); });
    public static readonly BindableProperty CargarMasCommandProperty = Crear<ICommand?>(nameof(CargarMasCommand), null);
    /// <summary>Preferencia del sistema «reducir movimiento»: desactiva el pulso del skeleton (el spinner es retroalimentación funcional y se mantiene).</summary>
    public static readonly BindableProperty ReducirMovimientoProperty = Crear(nameof(ReducirMovimiento), false, v => v.ActualizarAnimacion());
    public static readonly BindableProperty EspacioItemsProperty = Crear(nameof(EspacioItems), 20d, v => v.AplicarEspacio());

    // Textos (los valores por defecto son genéricos; la pantalla los reemplaza con su copy aprobado).
    public static readonly BindableProperty TextoReposoProperty = Crear(nameof(TextoReposo), "Desliza hacia arriba para cargar más");
    public static readonly BindableProperty TextoCargandoProperty = Crear(nameof(TextoCargando), "Cargando más…");
    public static readonly BindableProperty TextoFinProperty = Crear(nameof(TextoFin), "No hay más registros para mostrar");
    public static readonly BindableProperty TextoContadorProperty = Crear(nameof(TextoContador), "");
    public static readonly BindableProperty TextoBotonProperty = Crear(nameof(TextoBoton), "Cargar más");
    public static readonly BindableProperty ErrorTituloProperty = Crear(nameof(ErrorTitulo), "No pudimos cargar más registros");
    public static readonly BindableProperty ErrorMensajeProperty = Crear(nameof(ErrorMensaje), "Revisa tu conexión e inténtalo más tarde");
    public static readonly BindableProperty VacioTituloProperty = Crear(nameof(VacioTitulo), "Aún no hay registros");
    public static readonly BindableProperty VacioDescripcionProperty = Crear(nameof(VacioDescripcion), "");
    public static readonly BindableProperty VacioIconoProperty = Crear<ImageSource?>(nameof(VacioIcono), null);
    public static readonly BindableProperty DescripcionListaProperty = Crear(nameof(DescripcionLista), "Listado");

    public EstadoCargaInfinita Estado { get => (EstadoCargaInfinita)GetValue(EstadoProperty); set => SetValue(EstadoProperty, value); }
    public IEnumerable? ItemsSource { get => (IEnumerable?)GetValue(ItemsSourceProperty); set => SetValue(ItemsSourceProperty, value); }
    public DataTemplate? ItemTemplate { get => (DataTemplate?)GetValue(ItemTemplateProperty); set => SetValue(ItemTemplateProperty, value); }
    public DataTemplate? SkeletonTemplate { get => (DataTemplate?)GetValue(SkeletonTemplateProperty); set => SetValue(SkeletonTemplateProperty, value); }
    public int CantidadSkeleton { get => (int)GetValue(CantidadSkeletonProperty); set => SetValue(CantidadSkeletonProperty, value); }
    public DataTemplate? CabeceraTemplate { get => (DataTemplate?)GetValue(CabeceraTemplateProperty); set => SetValue(CabeceraTemplateProperty, value); }
    public ICommand? CargarMasCommand { get => (ICommand?)GetValue(CargarMasCommandProperty); set => SetValue(CargarMasCommandProperty, value); }
    public bool ReducirMovimiento { get => (bool)GetValue(ReducirMovimientoProperty); set => SetValue(ReducirMovimientoProperty, value); }
    public double EspacioItems { get => (double)GetValue(EspacioItemsProperty); set => SetValue(EspacioItemsProperty, value); }
    public string TextoReposo { get => (string)GetValue(TextoReposoProperty); set => SetValue(TextoReposoProperty, value); }
    public string TextoCargando { get => (string)GetValue(TextoCargandoProperty); set => SetValue(TextoCargandoProperty, value); }
    public string TextoFin { get => (string)GetValue(TextoFinProperty); set => SetValue(TextoFinProperty, value); }
    public string TextoContador { get => (string)GetValue(TextoContadorProperty); set => SetValue(TextoContadorProperty, value); }
    public string TextoBoton { get => (string)GetValue(TextoBotonProperty); set => SetValue(TextoBotonProperty, value); }
    public string ErrorTitulo { get => (string)GetValue(ErrorTituloProperty); set => SetValue(ErrorTituloProperty, value); }
    public string ErrorMensaje { get => (string)GetValue(ErrorMensajeProperty); set => SetValue(ErrorMensajeProperty, value); }
    public string VacioTitulo { get => (string)GetValue(VacioTituloProperty); set => SetValue(VacioTituloProperty, value); }
    public string VacioDescripcion { get => (string)GetValue(VacioDescripcionProperty); set => SetValue(VacioDescripcionProperty, value); }
    public ImageSource? VacioIcono { get => (ImageSource?)GetValue(VacioIconoProperty); set => SetValue(VacioIconoProperty, value); }
    public string DescripcionLista { get => (string)GetValue(DescripcionListaProperty); set => SetValue(DescripcionListaProperty, value); }

    // ── Derivadas de Estado (una sola fuente de verdad; misma tabla que renderFoot() del prototipo) ──
    public bool MostrarSkeleton => Estado == EstadoCargaInfinita.PrimeraCarga;
    public bool MostrarVacio => Estado == EstadoCargaInfinita.Vacio;
    public bool MostrarAreaEstatica => MostrarSkeleton || MostrarVacio;
    public bool MostrarLista => !MostrarAreaEstatica;
    public bool MostrarReposo => Estado == EstadoCargaInfinita.Reposo;
    public bool MostrarCargando => Estado == EstadoCargaInfinita.Cargando;
    public bool MostrarError => Estado == EstadoCargaInfinita.Error;
    public bool MostrarFin => Estado == EstadoCargaInfinita.Fin;
    /// <summary>Figma (error): solo alerta + botón; se omite el contador.</summary>
    public bool MostrarContador => Estado != EstadoCargaInfinita.Error;
    /// <summary>Oculto en el estado final; visible (y, en Cargando, inactivo por CanExecute) en los demás con pie.</summary>
    public bool MostrarBoton => Estado != EstadoCargaInfinita.Fin;

    public IEnumerable<int> ItemsSkeleton => Enumerable.Range(0, Math.Max(0, CantidadSkeleton));
    public IEnumerable<object> ItemsCabecera => CabeceraTemplate is null ? Array.Empty<object>() : UnItem;
    public object? Cabecera => CabeceraTemplate is null ? null : UnItem[0];

    public CargaInfinitaView()
    {
        InitializeComponent();
        Raiz.BindingContext = this;   // solo la rejilla interna; el BindingContext del control sigue siendo el de la página
        Loaded += (_, _) => ActualizarAnimacion();
        Unloaded += (_, _) => DetenerAnimacion();
        AplicarEspacio();
    }

    // ── Comportamiento ───────────────────────────────────────────────────────
    private void AlAlcanzarUmbral(object? sender, EventArgs e)
    {
        // Solo en Reposo: en Error el reintento es del botón (PI-SWAP-05); en Cargando/Fin no hay nada que pedir.
        if (Estado == EstadoCargaInfinita.Reposo && CargarMasCommand is { } c && c.CanExecute(null)) c.Execute(null);
    }

    private void AlCambiarEstado()
    {
        foreach (var n in new[] { nameof(MostrarSkeleton), nameof(MostrarVacio), nameof(MostrarAreaEstatica), nameof(MostrarLista),
                                  nameof(MostrarReposo), nameof(MostrarCargando), nameof(MostrarError), nameof(MostrarFin),
                                  nameof(MostrarContador), nameof(MostrarBoton) })
            OnPropertyChanged(n);
        ActualizarAnimacion();
    }

    private void AplicarEspacio()
    {
        Lista.ItemsLayout = new LinearItemsLayout(ItemsLayoutOrientation.Vertical) { ItemSpacing = EspacioItems };
        ContenedorSkeleton.Spacing = EspacioItems;
    }

    /// <summary>Pulso del skeleton: opacidad 1 → 0,45 → 1 cada 1,4 s (prototipo: @keyframes sw-pulse). Sin pulso con ReducirMovimiento.</summary>
    private void ActualizarAnimacion()
    {
        DetenerAnimacion();
        if (!MostrarSkeleton || ReducirMovimiento || !IsLoaded) return;

        var pulso = new Animation();
        pulso.Add(0.0, 0.5, new Animation(v => ContenedorSkeleton.Opacity = v, 1.0, 0.45, Easing.SinInOut));
        pulso.Add(0.5, 1.0, new Animation(v => ContenedorSkeleton.Opacity = v, 0.45, 1.0, Easing.SinInOut));
        pulso.Commit(ContenedorSkeleton, NombreAnimacion, rate: 16, length: 1400, repeat: () => true);
    }

    private void DetenerAnimacion()
    {
        ContenedorSkeleton.AbortAnimation(NombreAnimacion);
        ContenedorSkeleton.Opacity = 1;
    }

    private static BindableProperty Crear<T>(string nombre, T porDefecto, Action<CargaInfinitaView>? cambio = null) =>
        BindableProperty.Create(nombre, typeof(T), typeof(CargaInfinitaView), porDefecto,
            propertyChanged: cambio is null ? null : (b, _, _) => cambio((CargaInfinitaView)b));
}
