// CÓDIGO DE REFERENCIA UX, NO PRODUCTIVO. No compilado.
using Compensar.MedicinaPrepagada.ViewModels;

namespace Compensar.MedicinaPrepagada.Views;

public partial class MisSolicitudesPage : ContentPage
{
    private readonly MisSolicitudesViewModel _viewModel;

    public MisSolicitudesPage(MisSolicitudesViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InicializarAsync();
    }
}
