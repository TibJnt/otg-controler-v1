'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">OTG Controller</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">Status: Idle</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Select Devices Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Select Devices</h2>
              <p className="text-muted text-sm">Device selection will be implemented here.</p>
            </section>

            {/* Device Coordinates Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Device Action Coordinates</h2>
              <p className="text-muted text-sm">Coordinate calibration will be implemented here.</p>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Automation Settings Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Automation Settings</h2>
              <p className="text-muted text-sm">Automation settings will be implemented here.</p>
            </section>

            {/* Automation Actions Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Automation Actions (Triggers)</h2>
              <p className="text-muted text-sm">Trigger configuration will be implemented here.</p>
            </section>

            {/* Controls Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Controls</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors">
                  Start Automation
                </button>
                <button className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger-hover transition-colors">
                  Stop
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Logs Section */}
        <section className="mt-6 rounded-lg border border-card-border bg-card p-6">
          <h2 className="text-lg font-medium mb-4">Logs</h2>
          <div className="bg-background rounded-md p-4 h-48 overflow-y-auto font-mono text-sm">
            <p className="text-muted">Logs will appear here...</p>
          </div>
        </section>
      </main>
    </div>
  );
}
