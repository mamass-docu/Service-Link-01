import BookServiceScreen from "../src/screens/customer/bookings/BookServiceScreen";
import PaymentOptionsScreen from "../src/screens/customer/bookings/PaymentOptionsScreen";
import CustomerMainDashboard from "../src/screens/customer/CustomerMainDashboard";
import CustomerTermsAndConditionsScreen from "../src/screens/customer/CustomerTermsAndConditionsScreen";
import GCashPaymentScreen from "../src/screens/customer/home/GCashPaymentScreen";
import MoreServices from "../src/screens/customer/home/MoreServices";
import PayMayaPaymentScreen from "../src/screens/customer/home/PayMayaPaymentScreen";
import ProviderOptionScreen from "../src/screens/customer/home/ProviderOptionScreen";
import Addresses from "../src/screens/customer/profile/Addresses";
import CustomerEditProfileScreen from "../src/screens/customer/profile/CustomerEditProfile";
import HelpAndSupportScreen from "../src/screens/customer/profile/HelpAndSupportScreen";
import PrivacyAndSecurityScreen from "../src/screens/customer/profile/PrivacyAndSecurityScreen";
import SearchResultsScreen from "../src/screens/customer/SearchResults/SearchResultsScreen";

export const Customers = (Stack) => (
  <>
    <Stack.Screen
      name="CustomerTermsAndConditions"
      component={CustomerTermsAndConditionsScreen}
    />
    <Stack.Screen name="CustomerHome" component={CustomerMainDashboard} />
    <Stack.Screen name="Addresses" component={Addresses} />
    <Stack.Screen
      name="CustomerEditProfile"
      component={CustomerEditProfileScreen}
    />
    <Stack.Screen
      name="CustomerHelpAndSupport"
      component={HelpAndSupportScreen}
    />
    <Stack.Screen
      name="CustomerPrivacyAndSecurity"
      component={PrivacyAndSecurityScreen}
    />

    <Stack.Screen name="CustomerMoreServices" component={MoreServices} />
    <Stack.Screen
      name="CustomerProviderOption"
      component={ProviderOptionScreen}
    />

    <Stack.Screen name="BookService" component={BookServiceScreen} />
    <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
    <Stack.Screen name="PayMayaPayment" component={PayMayaPaymentScreen} />
    <Stack.Screen name="GCashPayment" component={GCashPaymentScreen} />
    <Stack.Screen
      name="PaymentOptionsScreen"
      component={PaymentOptionsScreen}
    />
  </>
);
