import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/customer.dart';
import '../../models/employee.dart';
import '../../shared/widgets/service_form_widgets.dart';
import 'service_request_edit_selectors.dart';

class ServiceRequestEditCustomerSection extends StatelessWidget {
  final TextEditingController contactPersonController;
  final TextEditingController contactPhoneController;
  final TextEditingController contactEmailController;
  final TextEditingController locationController;
  final AsyncValue<List<Customer>> customersAsync;
  final AsyncValue<List<Employee>> employeesAsync;
  final String? selectedCustomerId;
  final String? selectedReceivedBy;
  final Function(String?) onCustomerSelected;
  final Function(List<Customer>) onShowCustomerPicker;
  final Function(List<Employee>) onShowEmployeePicker;

  const ServiceRequestEditCustomerSection({
    super.key,
    required this.contactPersonController,
    required this.contactPhoneController,
    required this.contactEmailController,
    required this.locationController,
    required this.customersAsync,
    required this.employeesAsync,
    required this.selectedCustomerId,
    required this.selectedReceivedBy,
    required this.onCustomerSelected,
    required this.onShowCustomerPicker,
    required this.onShowEmployeePicker,
  });

  @override
  Widget build(BuildContext context) {
    return ServiceFormSection(
      title: 'Müşteri ve İletişim',
      icon: CupertinoIcons.person_2,
      iconColor: ServiceFormStyles.successColor,
      children: [
        ServiceRequestEditSelectors.buildCustomerSelector(
          customersAsync: customersAsync,
          selectedCustomerId: selectedCustomerId,
          onCustomerSelected: onCustomerSelected,
          onShowPicker: onShowCustomerPicker,
        ),
        const SizedBox(height: 10),

        ServiceFormTextField(
          controller: contactPersonController,
          label: 'İletişim Kişisi',
          hint: 'Ad Soyad',
          icon: CupertinoIcons.person,
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: ServiceFormTextField(
                controller: contactPhoneController,
                label: 'Telefon',
                hint: '0(555) 123 45 67',
                icon: CupertinoIcons.phone,
                keyboardType: const TextInputType.numberWithOptions(decimal: false),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ServiceFormTextField(
                controller: contactEmailController,
                label: 'E-posta',
                hint: 'email@ornek.com',
                icon: CupertinoIcons.mail,
                keyboardType: TextInputType.emailAddress,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        ServiceRequestEditSelectors.buildReceivedBySelector(
          employeesAsync: employeesAsync,
          selectedReceivedBy: selectedReceivedBy,
          onShowPicker: onShowEmployeePicker,
        ),
      ],
    );
  }
}

