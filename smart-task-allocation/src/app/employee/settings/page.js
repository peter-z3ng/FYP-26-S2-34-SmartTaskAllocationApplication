import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import UserFeedbackForm from "@/components/UserFeedbackForm";

export default function EmployeeSettingsPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Settings"
      subtitle="Manage your profile and notification preferences."
    >
      <div className="space-y-6">
        <ProfileSettingsForm />
        <SupportInquiryForm />
        <UserFeedbackForm />
      </div>
    </SideMenuLayout>
  );
}
