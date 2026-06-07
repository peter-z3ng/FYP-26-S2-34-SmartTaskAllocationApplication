import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import UserFeedbackForm from "@/components/UserFeedbackForm";

export default function ManagerSettingsPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Settings"
      subtitle="Adjust manager workflow preferences."
    >
      <div className="space-y-6">
        <ProfileSettingsForm />
        <SupportInquiryForm />
        <UserFeedbackForm />
      </div>
    </SideMenuLayout>
  );
}
