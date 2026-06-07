import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";
import SupportInquiryForm from "@/components/SupportInquiryForm";

export default function UserAdminSettingsPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Profile & Support"
      subtitle="Maintain your profile and contact platform support when your organization needs assistance."
    >
      <div className="space-y-6">
        <ProfileSettingsForm />
        <SupportInquiryForm />
      </div>
    </SideMenuLayout>
  );
}
