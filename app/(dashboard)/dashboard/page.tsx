import StatCard from "@/app/components/ui/StatCard";

<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

    <StatCard
        title="Contacts"
        value={1248}
        subtitle="Active CRM contacts"
    />

    <StatCard
        title="Properties"
        value={58}
        subtitle="Current inventory"
    />

    <StatCard
        title="Transactions"
        value={14}
        subtitle="Open deals"
    />

    <StatCard
        title="Tasks"
        value={17}
        subtitle="Due today"
    />

</div>