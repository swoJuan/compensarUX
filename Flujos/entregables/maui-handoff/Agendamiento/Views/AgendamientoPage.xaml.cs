using Compensar.MedicinaPrepagada.ViewModels;

namespace Compensar.MedicinaPrepagada.Views;

public partial class AgendamientoPage : ContentPage
{
    public AgendamientoPage(AgendamientoViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
