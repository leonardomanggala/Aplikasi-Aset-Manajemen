/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Asset, 
  User, 
  INITIAL_ASSETS, 
  INITIAL_USERS, 
  MaintenanceLog, 
  AssetMutation, 
  AssetDocument,
  AssetHistoryLog,
  generateNoSeriFinal,
  calculateStraightLineDepreciation,
  isAssetDepreciable,
  JENIS_ASET_MAP,
  LETAK_RUANG_MAP,
  TERITORI_MAP,
  PERUNTUKAN_MAP,
  KODE_NAMA_BARANG_MAP,
  BIDANG_MAP
} from './types';
import {
  getAllAssetsFromFirebase,
  saveAssetToFirebase,
  deleteAssetFromFirebase,
  deleteAssetsFromFirebase,
  getAllUsersFromFirebase,
  saveUserToFirebase,
  deleteUserFromFirebase,
  subscribeToAssets,
  subscribeToUsers,
  subscribeToMasterData,
  syncAllAssetsToFirebase,
  syncAllUsersToFirebase,
  syncMasterDataToFirebase
} from './firebaseUtils';
import DashboardTab from './components/DashboardTab';
import AssetListTab from './components/AssetListTab';
import QrScanTab from './components/QrScanTab';
import BulkImportTab from './components/BulkImportTab';
import MasterDataTab from './components/MasterDataTab';
import AccountSettingsTab from './components/AccountSettingsTab';
import ReportsTab from './components/ReportsTab';
import AssetModal from './components/AssetModal';
import Login from './components/Login';
import { motion, AnimatePresence } from 'motion/react';

import { 
  LayoutDashboard, 
  ClipboardList, 
  Scan, 
  FileSpreadsheet,
  FileText,
  UserCheck, 
  Clock, 
  Church, 
  Lock, 
  ShieldCheck,
  Compass,
  Database,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export default function App() {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sim_aset_is_authenticated') === 'true';
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const cachedData = localStorage.getItem('sim_aset_paroki_data');
    let rawAssets = INITIAL_ASSETS;
    if (cachedData) {
      try {
        rawAssets = JSON.parse(cachedData);
      } catch (err) {
        rawAssets = INITIAL_ASSETS;
      }
    }
    // Refresh calculations dynamically on boot to ensure exact system policies
    return rawAssets.map(asset => {
      const depr = calculateStraightLineDepreciation(
        asset.hargaPembelian,
        asset.nilaiResidu,
        asset.umurManfaat,
        asset.tanggalPerolehan,
        new Date().toISOString(),
        isAssetDepreciable(asset)
      );
      return {
        ...asset,
        nilaiBuku: depr.nilaiBuku,
        biayaPenyusutan: depr.biayaPenyusutan
      };
    });
  });

  const [isLoading, setIsLoading] = useState(true);

  // Subscriptions to Firebase
  useEffect(() => {
    setIsLoading(true);
    let masterDataInit = false;

    const unsubAssets = subscribeToAssets((remoteAssets) => {
      if (remoteAssets) {
        setAssets(remoteAssets.map(asset => {
          const depr = calculateStraightLineDepreciation(
            asset.hargaPembelian,
            asset.nilaiResidu,
            asset.umurManfaat,
            asset.tanggalPerolehan,
            new Date().toISOString(),
            isAssetDepreciable(asset)
          );
          
          // Auto-correct older serial number formats in-memory
          const correctSerial = generateNoSeriFinal(asset);
          
          return {
            ...asset,
            noSeriFinal: correctSerial,
            nilaiBuku: depr.nilaiBuku,
            biayaPenyusutan: depr.biayaPenyusutan
          };
        }));
      }
    });

    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (remoteUsers) {
        setUsers(remoteUsers.map(user => {
          const defaultValue = INITIAL_USERS.find(iu => iu.id === user.id || iu.email === user.email);
          return {
            ...user,
            username: user.username || defaultValue?.username || user.email.split('@')[0],
            password: user.password || defaultValue?.password || '123'
          };
        }));
      }
    });

    const unsubMasterData = subscribeToMasterData((remoteMasterData) => {
      if (remoteMasterData) {
        if (remoteMasterData.jenisAsetMap) setJenisAsetMap(remoteMasterData.jenisAsetMap);
        if (remoteMasterData.letakRuangMap) setLetakRuangMap(remoteMasterData.letakRuangMap);
        if (remoteMasterData.teritoriMap) setTeritoriMap(remoteMasterData.teritoriMap);
        if (remoteMasterData.peruntukanMap) setPeruntukanMap(remoteMasterData.peruntukanMap);
        if (remoteMasterData.kodeNamaBarangMap) setKodeNamaBarangMap(remoteMasterData.kodeNamaBarangMap);
        if (remoteMasterData.bidangMap) setBidangMap(remoteMasterData.bidangMap);
        if (remoteMasterData.appLogo !== undefined) setAppLogo(remoteMasterData.appLogo);
      }
      if (!masterDataInit) {
        masterDataInit = true;
        setIsLoading(false);
        if (!remoteMasterData) {
          syncMasterDataToFirebase({
            jenisAsetMap: JSON.parse(localStorage.getItem('sim_aset_paroki_jenis_aset') || 'null') || JENIS_ASET_MAP,
            letakRuangMap: JSON.parse(localStorage.getItem('sim_aset_paroki_letak_ruang') || 'null') || LETAK_RUANG_MAP,
            teritoriMap: JSON.parse(localStorage.getItem('sim_aset_paroki_teritori') || 'null') || TERITORI_MAP,
            peruntukanMap: JSON.parse(localStorage.getItem('sim_aset_paroki_peruntukan') || 'null') || PERUNTUKAN_MAP,
            kodeNamaBarangMap: JSON.parse(localStorage.getItem('sim_aset_paroki_kode_barang') || 'null') || KODE_NAMA_BARANG_MAP,
            bidangMap: JSON.parse(localStorage.getItem('sim_aset_paroki_bidang') || 'null') || BIDANG_MAP,
            appLogo: localStorage.getItem('sim_aset_paroki_logo') || null
          }).catch(console.error);
        } else if (remoteMasterData.appLogo === undefined) {
          const localLogo = localStorage.getItem('sim_aset_paroki_logo');
          if (localLogo) {
            syncMasterDataToFirebase({ appLogo: localLogo }).catch(console.error);
          }
        }
      }
    });

    return () => {
      unsubAssets();
      unsubUsers();
      unsubMasterData();
    };
  }, []); // Only on mount

  const handleTabChange = (tab: 'dashboard' | 'assets_bergerak' | 'assets_tidak_bergerak' | 'qr' | 'import' | 'master' | 'reports' | 'account') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const cached = localStorage.getItem('sim_aset_current_user');
    const parsed = cached ? JSON.parse(cached) : INITIAL_USERS[0];
    const defaultValue = INITIAL_USERS.find(iu => iu.id === parsed.id || iu.email === parsed.email);
    return {
      ...parsed,
      username: parsed.username || defaultValue?.username || parsed.email.split('@')[0],
      password: parsed.password || defaultValue?.password || '123'
    };
  });
  const [users, setUsers] = useState<User[]>(() => {
    const cachedUsers = localStorage.getItem('sim_aset_registered_users');
    let rawUsers = INITIAL_USERS;
    if (cachedUsers) {
      try {
        const parsed = JSON.parse(cachedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawUsers = parsed;
        }
      } catch (err) {
        rawUsers = INITIAL_USERS;
      }
    }
    // Gabungkan dengan kredensial default dari INITIAL_USERS untuk mengatasi data legacy cache
    return rawUsers.map(user => {
      const defaultValue = INITIAL_USERS.find(iu => iu.id === user.id || iu.email === user.email);
      return {
        ...user,
        username: user.username || defaultValue?.username || user.email.split('@')[0],
        password: user.password || defaultValue?.password || '123'
      };
    });
  });

  const [appLogo, setAppLogo] = useState<string | null>(() => {
    return localStorage.getItem('sim_aset_paroki_logo');
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets_bergerak' | 'assets_tidak_bergerak' | 'qr' | 'import' | 'master' | 'reports' | 'account'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const cached = localStorage.getItem('sim_aset_sidebar_collapsed');
    return cached === 'true';
  });
  const [isAssetMenuExpanded, setIsAssetMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const cached = localStorage.getItem('sim_aset_theme');
    if (cached !== null) {
      return cached === 'dark';
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sim_aset_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sim_aset_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const nextVal = !prev;
      localStorage.setItem('sim_aset_sidebar_collapsed', String(nextVal));
      return nextVal;
    });
  };
  
  // Specific scanner viewport loaded asset
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);

  // Time clock display
  const [currentTime, setCurrentTime] = useState<string>('');

  // Stateful Master Data Maps
  const [jenisAsetMap, setJenisAsetMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_jenis_aset');
    return cached ? JSON.parse(cached) : JENIS_ASET_MAP;
  });
  const [letakRuangMap, setLetakRuangMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_letak_ruang');
    return cached ? JSON.parse(cached) : LETAK_RUANG_MAP;
  });
  const [teritoriMap, setTeritoriMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_teritori');
    return cached ? JSON.parse(cached) : TERITORI_MAP;
  });
  const [peruntukanMap, setPeruntukanMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_peruntukan');
    return cached ? JSON.parse(cached) : PERUNTUKAN_MAP;
  });
  const [kodeNamaBarangMap, setKodeNamaBarangMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_kode_nama_barang');
    return cached ? JSON.parse(cached) : KODE_NAMA_BARANG_MAP;
  });
  const [bidangMap, setBidangMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('sim_aset_paroki_bidang');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Object.keys(parsed).length > 0) return parsed;
    }
    return BIDANG_MAP;
  });

  // 1. Persist to localStorage whenever assets modify
  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_data', JSON.stringify(assets));
  }, [assets]);

  // Persist master maps to localStorage and Firebase
  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_jenis_aset', JSON.stringify(jenisAsetMap));
    
  }, [jenisAsetMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_letak_ruang', JSON.stringify(letakRuangMap));
    
  }, [letakRuangMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_teritori', JSON.stringify(teritoriMap));
    
  }, [teritoriMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_peruntukan', JSON.stringify(peruntukanMap));
    
  }, [peruntukanMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_kode_nama_barang', JSON.stringify(kodeNamaBarangMap));
    
  }, [kodeNamaBarangMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_paroki_bidang', JSON.stringify(bidangMap));
    
  }, [bidangMap, isLoading]);

  useEffect(() => {
    localStorage.setItem('sim_aset_registered_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (appLogo) {
      localStorage.setItem('sim_aset_paroki_logo', appLogo);
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = appLogo;
      }
    } else {
      localStorage.removeItem('sim_aset_paroki_logo');
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/vite.svg'; // Default fallback
      }
    }
  }, [appLogo]);

  // 3. Dynamic ticking clock matching local times & server Z-time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Select operator in RBAC switcher
  const handleOperatorChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sim_aset_current_user', JSON.stringify(user));
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sim_aset_current_user', JSON.stringify(user));
    localStorage.setItem('sim_aset_is_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sim_aset_is_authenticated');
    setIsAuthenticated(false);
  };

  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('sim_aset_current_user', JSON.stringify(updatedUser));
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    saveUserToFirebase(updatedUser).catch(console.error);
  };

  const handleAppLogoChange = (logo: string | null) => {
    setAppLogo(logo);
    syncMasterDataToFirebase({ appLogo: logo }).catch(console.error);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    saveUserToFirebase(newUser).catch(console.error);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUserFromFirebase(userId).catch(console.error);
  };

  // Actions: Add new Asset
  const handleAddAsset = (newAsset: Asset) => {
    // Implementasikan logika otomatisasi (Auto Urut)
    const baseKey = `${newAsset.jenisAset}-${newAsset.teritori}-${newAsset.peruntukan}-${newAsset.letakRuang}-${newAsset.kodeNamaBarang}`;
    let maxUrut = 0;
    for (const a of assets) {
      const aBase = `${a.jenisAset}-${a.teritori}-${a.peruntukan}-${a.letakRuang}-${a.kodeNamaBarang}`;
      if (aBase === baseKey) {
        const u = parseInt(a.noUrutSejenis, 10);
        if (!isNaN(u) && u > maxUrut) maxUrut = u;
      }
    }
    const currentUrut = String(maxUrut + 1);
    
    // Update the asset with the newly calculated auto-incrementing sequence number
    newAsset.noUrutSejenis = currentUrut;
    newAsset.noSeriFinal = generateNoSeriFinal({
      jenisAset: newAsset.jenisAset,
      teritori: newAsset.teritori,
      peruntukan: newAsset.peruntukan,
      letakRuang: newAsset.letakRuang,
      kodeNamaBarang: newAsset.kodeNamaBarang,
      tahun: newAsset.tahun,
      tanggalPerolehan: newAsset.tanggalPerolehan,
      noUrutSejenis: currentUrut
    });

    const log: AssetHistoryLog = {
      id: Date.now().toString(),
      assetId: newAsset.id,
      action: 'CREATE',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      details: 'Menambahkan aset baru ke dalam sistem'
    };
    const assetWithLog = { ...newAsset, historyLogs: [log] };
    const nextAssets = [assetWithLog, ...assets];
    setAssets(nextAssets);
    saveAssetToFirebase(assetWithLog).catch(console.error);
  };

  // Actions: Update existing Asset
  const handleUpdateAsset = (updatedAsset: Asset) => {
    const oldAsset = assets.find(a => a.id === updatedAsset.id);
    let detailsStr = 'Memperbarui data aset';
    if (oldAsset && oldAsset.kondisiBarang !== updatedAsset.kondisiBarang) {
      detailsStr = `Memperbarui kondisi barang dari ${oldAsset.kondisiBarang} menjadi ${updatedAsset.kondisiBarang}`;
    }

    const log: AssetHistoryLog = {
      id: Date.now().toString(),
      assetId: updatedAsset.id,
      action: 'UPDATE',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      details: detailsStr
    };
    const assetWithLog = { 
      ...updatedAsset, 
      historyLogs: updatedAsset.historyLogs ? [log, ...updatedAsset.historyLogs] : [log] 
    };

    const nextAssets = assets.map(a => a.id === assetWithLog.id ? assetWithLog : a);
    setAssets(nextAssets);
    saveAssetToFirebase(assetWithLog).catch(console.error);
    
    // update scan focus if it was active
    if (scannedAsset && scannedAsset.id === assetWithLog.id) {
      setScannedAsset(assetWithLog);
    }
    if (selectedAsset && selectedAsset.id === assetWithLog.id) {
      setSelectedAsset(assetWithLog);
    }
  };

  // Actions: Delete Asset
  const handleDeleteAsset = (id: string) => {
    const nextAssets = assets.filter(a => a.id !== id);
    setAssets(nextAssets);
    deleteAssetFromFirebase(id).catch(console.error);

    if (scannedAsset && scannedAsset.id === id) {
      setScannedAsset(null);
    }
    if (selectedAsset && selectedAsset.id === id) {
      setSelectedAsset(null);
    }
  };

  // Actions: Delete Multiple Assets
  const handleDeleteAssets = (ids: string[]) => {
    setAssets(prev => prev.filter(a => !ids.includes(a.id)));
    deleteAssetsFromFirebase(ids).catch(console.error);

    if (scannedAsset && ids.includes(scannedAsset.id)) {
      setScannedAsset(null);
    }
    if (selectedAsset && ids.includes(selectedAsset.id)) {
      setSelectedAsset(null);
    }
  };

  // Actions: Add maintenance service record to asset
  const handleAddMaintenanceLog = (assetId: string, log: MaintenanceLog) => {
    const nextAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const logs = asset.maintenanceLogs ? [...asset.maintenanceLogs, log] : [log];
        // Sort logs descending (latest first)
        logs.sort((a, b) => new Date(b.tanggalServis).getTime() - new Date(a.tanggalServis).getTime());
        
        const historyLog: AssetHistoryLog = {
          id: Date.now().toString(),
          assetId: assetId,
          action: 'MAINTENANCE',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          details: `Melakukan servis/pemeliharaan: ${log.deskripsi}`
        };

        const updatedAsset = {
          ...asset,
          maintenanceLogs: logs,
          kondisiBarang: 'BAIK' as const, // Automatically restoring condition to BAIK after service logging!
          updatedAt: new Date().toISOString(),
          historyLogs: asset.historyLogs ? [historyLog, ...asset.historyLogs] : [historyLog]
        };
        saveAssetToFirebase(updatedAsset).catch(console.error);
        return updatedAsset;
      }
      return asset;
    });

    setAssets(nextAssets);

    // Refresh active focuses
    const found = nextAssets.find(a => a.id === assetId);
    if (found) {
      if (scannedAsset && scannedAsset.id === assetId) setScannedAsset(found);
      if (selectedAsset && selectedAsset.id === assetId) setSelectedAsset(found);
    }
  };

  // Actions: Add physical relocation log (Mutation)
  const handleAddMutation = (assetId: string, mutation: AssetMutation) => {
    const nextAssets = assets.map(asset => {
      if (asset.id === assetId) {
        // Dynamic resegmentation of final serial code according to the level-5 room change!
        const nextCode = generateNoSeriFinal({
          ...asset,
          letakRuang: mutation.ruangTujuan
        });

        const updatedDepr = calculateStraightLineDepreciation(
          asset.hargaPembelian,
          asset.nilaiResidu,
          asset.umurManfaat,
          asset.tanggalPerolehan,
          new Date().toISOString(),
          isAssetDepreciable(asset)
        );

        const mutList = asset.mutations ? [mutation, ...asset.mutations] : [mutation];
        
        const historyLog: AssetHistoryLog = {
          id: Date.now().toString(),
          assetId: assetId,
          action: 'MUTASI',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          details: `Mutasi ruang dari ${letakRuangMap[asset.letakRuang] || asset.letakRuang} ke ${letakRuangMap[mutation.ruangTujuan] || mutation.ruangTujuan}`
        };

        const updatedAsset = {
          ...asset,
          letakRuang: mutation.ruangTujuan, // update room penempatan
          noSeriFinal: nextCode, // update automatic serial identifier
          nilaiBuku: updatedDepr.nilaiBuku,
          mutations: mutList,
          updatedAt: new Date().toISOString(),
          historyLogs: asset.historyLogs ? [historyLog, ...asset.historyLogs] : [historyLog]
        };
        saveAssetToFirebase(updatedAsset).catch(console.error);
        return updatedAsset;
      }
      return asset;
    });

    setAssets(nextAssets);

    // Refresh active focuses
    const found = nextAssets.find(a => a.id === assetId);
    if (found) {
      if (scannedAsset && scannedAsset.id === assetId) setScannedAsset(found);
      if (selectedAsset && selectedAsset.id === assetId) setSelectedAsset(found);
    }
  };

  // Actions: Attach digital scanned proof document
  const handleAddDocument = (assetId: string, doc: AssetDocument) => {
    const nextAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const docList = asset.documents ? [doc, ...asset.documents] : [doc];
        const updatedAsset = {
          ...asset,
          documents: docList,
          updatedAt: new Date().toISOString()
        };
        saveAssetToFirebase(updatedAsset).catch(console.error);
        return updatedAsset;
      }
      return asset;
    });

    setAssets(nextAssets);

    const found = nextAssets.find(a => a.id === assetId);
    if (found) {
      if (scannedAsset && scannedAsset.id === assetId) setScannedAsset(found);
      if (selectedAsset && selectedAsset.id === assetId) setSelectedAsset(found);
    }
  };

  // Actions: Excel worksheet bulk append or overwrite
  const handleImportAssets = (importedList: Asset[], replaceExisting?: boolean) => {
    // Deduplicate the incoming imported list itself (first one wins to avoid internal duplicates)
    const uniqueImportedMap = new Map<string, Asset>();
    importedList.forEach(asset => {
      // Allow duplicates of noSeriFinal, distinguish by ID!
      uniqueImportedMap.set(asset.id, asset);
    });
    const uniqueImported = Array.from(uniqueImportedMap.values());

    if (replaceExisting) {
      setAssets(uniqueImported);
      syncAllAssetsToFirebase(uniqueImported).catch(console.error);
    } else {
      // For appending, use a Map to merge existing and imported assets, preventing any duplicate No Seri Final
      const mergedMap = new Map<string, Asset>();
      // First, seed with existing assets by ID
      assets.forEach(asset => {
        mergedMap.set(asset.id, asset);
      });
      // Then overwrite or add imported assets
      uniqueImported.forEach(asset => {
        mergedMap.set(asset.id, asset);
      });
      
      const nextAssets = Array.from(mergedMap.values());
      setAssets(nextAssets);
      syncAllAssetsToFirebase(nextAssets).catch(console.error);
    }
  };

  const handleClearAllAssets = () => {
    // Delete all assets sequentially (or keep it simple, overwrite or delete)
    // Note: for production, bulk delete in Firebase is better handled by a batch, but this is a helper.
    assets.forEach(asset => deleteAssetFromFirebase(asset.id).catch(console.error));
    setAssets([]);
  };

  const handleInspectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleInspectAssetInScanner = (asset: Asset) => {
    setScannedAsset(asset);
    setActiveTab('qr');
    // scroll scanning camera into view if on mobile
    const scannerEl = document.getElementById('dashboard-container');
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isAuthenticated) {
    return (
      <Login 
        users={users} 
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        appLogo={appLogo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col md:flex-row antialiased font-sans">
      
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white">
              <Church className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">SIMAS Gereja</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. Left Sidebar Navigation Panel */}
      <aside className={`simas-sidebar fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-72 md:w-auto ${isSidebarCollapsed ? 'md:w-16' : 'md:w-56'} bg-slate-950 flex flex-col border-r border-slate-800/50 text-slate-300 shrink-0 select-none md:sticky md:top-0 h-screen transition-all duration-300 ease-in-out shadow-2xl shadow-slate-950/20`}>
        
        {/* Sidebar Header Brand segment */}
        <div className={`h-16 ${isSidebarCollapsed ? 'px-2' : 'px-4'} border-b border-slate-800/50 flex items-center justify-between transition-all`}>
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="flex items-center gap-2.5 animate-fade-in shrink-0">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-8.5 h-8.5 rounded-lg object-contain bg-white shrink-0" />
              ) : (
                <div className="w-8.5 h-8.5 bg-primary-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
                  <Church className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-white tracking-tight text-xs md:text-sm font-display">SIMAS Gereja</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">Paroki Pringwulung</p>
              </div>
            </div>
          )}
          {isSidebarCollapsed && !isMobileMenuOpen && (
            <div className="w-9 h-9 mx-auto bg-primary-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0 cursor-pointer" onClick={toggleSidebar} title="SIMAS Gereja (Perbesar)">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-full h-full rounded-lg object-contain bg-white" />
              ) : (
                <Church className="w-5 h-5" />
              )}
            </div>
          )}
          
          {/* Close button for mobile */}
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse trigger button */}
          <button 
            type="button"
            onClick={toggleSidebar}
            className={`hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/50 transition-colors ${isSidebarCollapsed ? 'ml-0' : ''}`}
            title={isSidebarCollapsed ? "Expand Sidebar (Perbesar menu)" : "Collapse Sidebar (Kecilkan menu)"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Menu sections */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 px-2">Menu Utama</div>
          )}
          
          <button
            onClick={() => handleTabChange('dashboard')}
            title="Dashboard Rekapitulasi"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'dashboard'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            title="Laporan Inventaris dan Akuntansi"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'reports'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Pelaporan</span>}
          </button>

          <div className="space-y-1">
            <button
              onClick={() => {
                if (isSidebarCollapsed) {
                  setIsSidebarCollapsed(false);
                  setIsAssetMenuExpanded(true);
                } else {
                  setIsAssetMenuExpanded(!isAssetMenuExpanded);
                }
              }}
              title={`Register Aset (${assets.length})`}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'justify-between py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition relative ${
                (activeTab === 'assets_bergerak' || activeTab === 'assets_tidak_bergerak')
                  ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className={`w-4 h-4 text-primary-500 shrink-0 ${isSidebarCollapsed ? 'mx-auto' : ''}`} />
                {!isSidebarCollapsed && <span>Register Aset ({assets.length})</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown className={`w-4 h-4 transition-transform ${isAssetMenuExpanded ? 'rotate-180' : ''}`} />
              )}
            </button>
            
            <AnimatePresence>
              {isAssetMenuExpanded && !isSidebarCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-1 pl-4"
                >
                  <button
                    onClick={() => handleTabChange('assets_tidak_bergerak')}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
                      activeTab === 'assets_tidak_bergerak'
                        ? 'bg-[#274a79] text-blue-200 font-bold ring-1 ring-blue-400/30 shadow-lg shadow-blue-950/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                      Tidak Bergerak
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full">{assets.filter(a => a.kategoriAset === 'tidak_bergerak').length}</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('assets_bergerak')}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
                      activeTab === 'assets_bergerak'
                        ? 'bg-[#274a79] text-blue-200 font-bold ring-1 ring-blue-400/30 shadow-lg shadow-blue-950/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                      Bergerak
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full">{assets.filter(a => a.kategoriAset === 'bergerak' || a.kategoriAset === undefined).length}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => handleTabChange('qr')}
            title="Pantau & QR Scanner Hub"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3 text-primary-500 hover:bg-slate-800/50' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'qr'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Scan className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Scanner & QR Booth</span>}
          </button>

          {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => handleTabChange('import')}
            title="Unggah Lembar Kerja Excel"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'import'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Unggah Massal</span>}
          </button>
          )}

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'KOORDINATOR_TIM') && (
          <button
            onClick={() => handleTabChange('master')}
            title="Konfigurasi Master Data"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'master'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Master Data</span>}
          </button>
          )}

          <button
            onClick={() => handleTabChange('account')}
            title="Pengaturan Akun"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 py-2.5 px-3'} rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
              activeTab === 'account'
                ? 'bg-primary-500/10 text-primary-400 font-bold ring-1 ring-primary-500/30 shadow-lg shadow-primary-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-primary-500 shrink-0" />
            {!isSidebarCollapsed && <span>Pengaturan Akun</span>}
          </button>

        </nav>

        {/* Sidebar Footer RBAC Operator Switcher */}
        {!isSidebarCollapsed && currentUser.role === 'SUPER_ADMIN' && (
          <div className="p-4 border-t border-slate-800/50 bg-slate-950">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Ganti Operator Sesi:</span>
              <select
                value={currentUser.id}
                onChange={(e) => handleOperatorChange(e.target.value)}
                className="w-full text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800/50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id} className="text-slate-300 bg-slate-900">
                    {user.name} ({user.role === 'SUPER_ADMIN' ? 'SUPER' : user.role === 'KOORDINATOR_TIM' ? 'TIM' : 'VIEWER'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

      </aside>

      {/* 2. Right Main Layout Viewport Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header navigation with Clock indicator */}
        <header className="h-16 min-h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between px-5 lg:px-8 gap-3 shrink-0 py-3 md:py-0 sticky top-0 z-10 shadow-sm shadow-slate-200/40">
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pringwulung Live Workspace</span>
            <span className="text-slate-300 text-sm hidden md:inline">|</span>
            {/* Clock display */}
            <div className="text-[11px] text-slate-500 font-mono font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span>{currentTime || 'Mempersiapkan jam...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global High-Contrast Style Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-1 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[10px] font-bold uppercase shadow-sm font-mono bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400"
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap (Kontras Tinggi)"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-[spin_10s_linear_infinite]" />
                  <span>TERANG</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>K. TINGGI (GELAP)</span>
                </>
              )}
            </button>

            <span className="text-[10px] font-mono text-slate-450 uppercase">AKTIF: <strong className="text-slate-700 font-bold font-sans">{currentUser.name}</strong></span>
            
            {currentUser.role === 'SUPER_ADMIN' ? (
              <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded text-[10px] uppercase font-bold border border-primary-100 flex items-center gap-1 shadow-sm font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                DITERAL ADMIN
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[10px] uppercase font-bold border border-slate-200 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-slate-400" />
                AKSES TERBATAS
              </span>
            )}

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 px-2.5 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900/70 dark:text-rose-300 flex items-center gap-1.5 transition-all cursor-pointer text-[10px] font-bold uppercase shadow-sm font-mono"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>KELUAR</span>
            </button>
          </div>

        </header>

        {/* Tab content area container */}
        <main className="flex-1 w-full max-w-[1800px] mx-auto p-5 md:p-7 xl:p-8 space-y-7 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  assets={assets}
                  onSelectAsset={handleInspectAssetInScanner}
                  jenisAsetMap={jenisAsetMap}
                  bidangMap={bidangMap}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsTab
                  assets={assets}
                  jenisAsetMap={jenisAsetMap}
                  letakRuangMap={letakRuangMap}
                  bidangMap={bidangMap}
                />
              )}

              {(activeTab === 'assets_bergerak' || activeTab === 'assets_tidak_bergerak') && (
                <AssetListTab
                  assets={assets}
                  currentUser={currentUser}
                  onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onDeleteAssets={handleDeleteAssets}
                  onSelectAsset={handleInspectAsset}
                  jenisAsetMap={jenisAsetMap}
                  letakRuangMap={letakRuangMap}
                  teritoriMap={teritoriMap}
                  peruntukanMap={peruntukanMap}
                  kodeNamaBarangMap={kodeNamaBarangMap}
                  bidangMap={bidangMap}
                  assetCategoryFilter={activeTab === 'assets_bergerak' ? 'bergerak' : 'tidak_bergerak'}
                />
              )}

              {activeTab === 'qr' && (
                <QrScanTab
                  assets={assets}
                  scannedAsset={scannedAsset}
                  onSetScannedAsset={setScannedAsset}
                  onAddMaintenanceLog={handleAddMaintenanceLog}
                  onAddMutation={handleAddMutation}
                  onAddDocument={handleAddDocument}
                  jenisAsetMap={jenisAsetMap}
                  letakRuangMap={letakRuangMap}
                />
              )}

              {activeTab === 'import' && (
                <BulkImportTab existingAssets={assets} onImportAssets={handleImportAssets}
                  onClearAllAssets={handleClearAllAssets}
                  assetsLength={assets.length}
                  jenisAsetMap={jenisAsetMap}
                  letakRuangMap={letakRuangMap}
                  teritoriMap={teritoriMap}
                  peruntukanMap={peruntukanMap}
                  kodeNamaBarangMap={kodeNamaBarangMap}
                  bidangMap={bidangMap}
                />
              )}

              {activeTab === 'master' && (
                <MasterDataTab
                  currentUser={currentUser}
                  assets={assets}
                  setAssets={setAssets}
                  jenisAsetMap={jenisAsetMap}
                  setJenisAsetMap={setJenisAsetMap}
                  letakRuangMap={letakRuangMap}
                  setLetakRuangMap={setLetakRuangMap}
                  teritoriMap={teritoriMap}
                  setTeritoriMap={setTeritoriMap}
                  peruntukanMap={peruntukanMap}
                  setPeruntukanMap={setPeruntukanMap}
                  kodeNamaBarangMap={kodeNamaBarangMap}
                  setKodeNamaBarangMap={setKodeNamaBarangMap}
                  bidangMap={bidangMap}
                  setBidangMap={setBidangMap}
                />
              )}

              {activeTab === 'account' && (
                <AccountSettingsTab
                  currentUser={currentUser}
                  onUpdateCurrentUser={handleUpdateCurrentUser}
                  bidangMap={bidangMap}
                  users={users}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  assets={assets}
                  appLogo={appLogo}
                  setAppLogo={handleAppLogoChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Dynamic bottom layout signature footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-[10px] font-mono text-slate-400 mt-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span>© 1997 - 2026 GEREJA SANTO YOHANES RASUL PRINGWULUNG.</span>
          <span className="text-[9px] bg-slate-50 px-2.5 py-1 rounded border inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
            HIGH DENSITY DATA ENGINE • RECALCULATED SECURE STATE
          </span>
        </footer>

      </div>

      {/* Global Inspectors asset details Overlay Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          jenisAsetMap={jenisAsetMap}
          letakRuangMap={letakRuangMap}
          teritoriMap={teritoriMap}
          peruntukanMap={peruntukanMap}
          kodeNamaBarangMap={kodeNamaBarangMap}
          bidangMap={bidangMap}
        />
      )}

    </div>
  );
}
