import React, { useCallback, useMemo, useState } from "react";
import { Box, Card } from "@mui/material";
import { LocationSidebar } from "./components/LocationSidebar";
import { MachineTabs } from "./components/MachineTabs";
import { MachineCard } from "../../pages/GearMonitoring/components/MachineCard";
import { useModal } from "../../hooks/useModal";
import { MachineDetailsPanel } from "./components/MachineDetailsPanel";
import { MachineDataProvider, useMachineData } from "./context/MachineDataContext";
import { Machine } from "./data";

export default function GearMonitoringDashboard() {
  return (
    <MachineDataProvider>
      <GearMonitoringMain />
    </MachineDataProvider>
  );
}

function GearMonitoringMain() {
  const { locations, allMachines } = useMachineData();
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [locationSearch, setLocationSearch] = useState("");
  const [machineSearch, setMachineSearch] = useState("");
  const { openModal } = useModal();

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return locations;
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.clientName.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locations, locationSearch]);

  // Machines filtered by selected location
  const filteredMachines = useMemo(() => {
    if (selectedLocationIndex === null) return allMachines;
    const locName = locations[selectedLocationIndex]?.name;
    return allMachines.filter(m => m.locationName === locName);
  }, [selectedLocationIndex, allMachines, locations]);

  // Machines filtered further by selected tab and search
  const visibleMachines = useMemo(() => {
    let machines = filteredMachines;
    if (selectedTab !== "ALL") {
      machines = machines.filter((m) => m.id === selectedTab);
    }
    if (machineSearch) {
      const search = machineSearch.toLowerCase();
      machines = machines.filter(m => 
        m.id.toLowerCase().includes(search) || 
        m.name.toLowerCase().includes(search)
      );
    }
    return machines;
  }, [filteredMachines, selectedTab, machineSearch]);

  const handleLocationSelect = useCallback((index: number | null) => {
    setSelectedLocationIndex(index);
    setSelectedTab("ALL"); // reset tab when location changes
  }, []);

  const handleTabChange = useCallback((tabValue: string) => {
    setSelectedTab(tabValue);
  }, []);

  const handleOpenDetail = useCallback((machine: Machine) => {
    openModal({
      title: `Machine Monitoring Details — ${machine.name}`,
      width: 480,
      askDataChangeConfirm: false,
      component: (modalProps: any) => (
        <MachineDataProvider>
          <MachineDetailsPanel
            machineId={machine.id}
            {...modalProps}
          />
        </MachineDataProvider>
      ),
    });
  }, [openModal]);

  return (
    <Card sx={{ display: "flex", }}>
      {/* Left Sidebar */}
      <LocationSidebar
        locations={filteredLocations}
        selectedIndex={selectedLocationIndex}
        onSelect={handleLocationSelect}
        totalMachineCount={allMachines.length}
        searchValue={locationSearch}
        onSearchChange={setLocationSearch}
      />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,

          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <MachineTabs
          machines={filteredMachines}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          searchValue={machineSearch}
          onSearchChange={setMachineSearch}
        />

        {/* Machine Cards Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 1,
          }}
        >
          {visibleMachines.map((machine) => (
            <MachineCard 
              key={machine.id} 
              machine={machine} 
              onOpenDetail={handleOpenDetail} 
            />
          ))}
        </Box>

        {visibleMachines.length === 0 && (
          <Card
            sx={{
              p: 6,
              textAlign: "center",

              fontWeight: 600,
              borderRadius: 3,
              mt: 2,
            }}
          >
            No machines found for the selected filters.
          </Card>
        )}
      </Box>
    </Card>
  );
}
