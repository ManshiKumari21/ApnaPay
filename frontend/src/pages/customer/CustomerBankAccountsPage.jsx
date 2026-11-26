import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  BankIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldIcon,
  XIcon,
  LockIcon,
  ChevronDownIcon,
  InfoIcon,
  CheckIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import {
  SUPPORTED_BANKS,
  searchBanks,
  groupBanksByCategory,
  findBank,
  validateBankName,
  validateAccountNumber,
  validateIfsc,
  lookupIfscBranch,
  isDemoMode,
  sanitizeIfscInput,
  sanitizeAccountNumber
} from '../../utils/bankValidation';

const CustomerBankAccountsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmUnlinkModal, setConfirmUnlinkModal] = useState(null); // { id, bankName, accountLast4 }

  // Form state
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    isPrimary: false
  });

  // Smart Bank Form States
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [customIfscPrefix, setCustomIfscPrefix] = useState(''); // 4 letters (A-Z) for custom bank
  const [ifscBranchSuffix, setIfscBranchSuffix] = useState(''); // 6 alphanumeric branch code characters
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: ''
  });
  const [fieldTouched, setFieldTouched] = useState({
    bankName: false,
    accountNumber: false,
    confirmAccountNumber: false,
    ifscCode: false
  });
  const [branchStatus, setBranchStatus] = useState({
    loading: false,
    verified: false,
    branch: null,
    error: ''
  });
  const [pasteWarning, setPasteWarning] = useState('');
  const bankDropdownRef = useRef(null);

  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification
  const [pendingAccountId, setPendingAccountId] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [registeredPhoneEnding, setRegisteredPhoneEnding] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('email'); // 'email' | 'sms'
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('email'); // Chosen channel on Step 1
  const [smsDeliveryInfo, setSmsDeliveryInfo] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState('');
  const [bannerError, setBannerError] = useState('');

  const otpInputsRef = useRef([]);
  const cooldownIntervalRef = useRef(null);

  const loadBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await bankAccountService.getLinkedAccounts();
      setBankAccounts(res.data || []);
    } catch (err) {
      setBannerError(err.response?.data?.message || err.message || 'Unable to load bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankAccounts();
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Handle outside clicks for bank autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Countdown timer helper for resend cooldown (30s default)
  const startCooldownTimer = (seconds = 30) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    setResendCooldown(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const openLinkModal = () => {
    setBankForm({
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      isPrimary: bankAccounts.length === 0
    });
    setSelectedBank(null);
    setBankSearchQuery('');
    setCustomIfscPrefix('');
    setIfscBranchSuffix('');
    setIsBankDropdownOpen(false);
    setFieldErrors({
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: ''
    });
    setFieldTouched({
      bankName: false,
      accountNumber: false,
      confirmAccountNumber: false,
      ifscCode: false
    });
    setBranchStatus({
      loading: false,
      verified: false,
      branch: null,
      error: ''
    });
    setPasteWarning('');
    setStep(1);
    setPendingAccountId(null);
    setOtpValue('');
    setOtpDigits(['', '', '', '', '', '']);
    setRegisteredPhoneEnding('');
    setMaskedMobile('');
    setMaskedEmail('');
    setDeliveryMethod('sms');
    setSmsDeliveryInfo(null);
    setResendMessage('');
    setFormError('');
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setPendingAccountId(null);
    setOtpValue('');
    setOtpDigits(['', '', '', '', '', '']);
    setRegisteredPhoneEnding('');
    setMaskedMobile('');
    setMaskedEmail('');
    setDeliveryMethod('sms');
    setSmsDeliveryInfo(null);
    setResendMessage('');
    setFormError('');
    setIsBankDropdownOpen(false);
    setSelectedBank(null);
    setCustomIfscPrefix('');
    setIfscBranchSuffix('');
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
  };

  // Select Bank from Autocomplete Dropdown
  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setBankSearchQuery(bank.name);
    setIsBankDropdownOpen(false);

    // Update bankForm.bankName
    setBankForm((prev) => ({
      ...prev,
      bankName: bank.name
    }));

    // Auto-generate configured first four IFSC characters
    setCustomIfscPrefix(bank.ifscPrefix);

    const maxLen = bank.accountLength.max;
    const truncatedAcct = bankForm.accountNumber ? bankForm.accountNumber.slice(0, maxLen) : '';
    const truncatedConfirm = bankForm.confirmAccountNumber ? bankForm.confirmAccountNumber.slice(0, maxLen) : '';

    let newAcctError = '';
    let newConfirmError = '';

    // Revalidate Account Number against new bank rules
    if (truncatedAcct) {
      const acctVal = validateAccountNumber(truncatedAcct, bank);
      if (!acctVal.valid) {
        newAcctError = acctVal.error;
      }
    }

    // Revalidate Confirm Account Number
    if (truncatedConfirm) {
      if (truncatedConfirm !== truncatedAcct) {
        newConfirmError = 'Account numbers do not match.';
      }
    }

    // Build complete IFSC with selected bank prefix + fixed 0 + branch suffix
    const fullIfsc = ifscBranchSuffix ? `${bank.ifscPrefix}0${ifscBranchSuffix}` : `${bank.ifscPrefix}0`;
    setBankForm((prev) => ({
      ...prev,
      bankName: bank.name,
      accountNumber: truncatedAcct,
      confirmAccountNumber: truncatedConfirm,
      ifscCode: fullIfsc
    }));

    let newIfscError = '';
    if (ifscBranchSuffix) {
      if (ifscBranchSuffix.length < 6) {
        newIfscError = 'Please enter the remaining 6 branch-code characters.';
        setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
      } else {
        const ifscVal = validateIfsc(fullIfsc, bank);
        if (!ifscVal.valid) {
          newIfscError = ifscVal.error;
          setBranchStatus({ loading: false, verified: false, branch: null, error: ifscVal.error });
        } else {
          setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
          triggerBranchLookup(fullIfsc, bank);
        }
      }
    } else {
      setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
    }

    setFieldErrors({
      bankName: '',
      accountNumber: newAcctError,
      confirmAccountNumber: newConfirmError,
      ifscCode: newIfscError
    });

    setFieldTouched((prev) => ({
      ...prev,
      bankName: true,
      accountNumber: Boolean(truncatedAcct),
      confirmAccountNumber: Boolean(truncatedConfirm),
      ifscCode: Boolean(ifscBranchSuffix)
    }));
  };

  // Bank Name Input Typing (Editable Input with Suggestions & Validation)
  const handleBankNameChange = (e) => {
    const val = e.target.value;
    setBankSearchQuery(val);
    setIsBankDropdownOpen(true);
    setFieldTouched((prev) => ({ ...prev, bankName: true }));

    // Bank Name Validation
    const nameVal = validateBankName(val);
    let nameError = '';
    if (!nameVal.valid && val.trim().length > 0) {
      nameError = nameVal.error;
    }

    const matched = findBank(val);
    if (matched) {
      setSelectedBank(matched);
      setCustomIfscPrefix(matched.ifscPrefix);
      const fullIfsc = ifscBranchSuffix ? `${matched.ifscPrefix}0${ifscBranchSuffix}` : '';
      setBankForm((prev) => ({ ...prev, bankName: val, ifscCode: fullIfsc }));
      setFieldErrors((prev) => ({ ...prev, bankName: nameError }));
      if (fullIfsc && ifscBranchSuffix.length === 6) {
        const ifscRes = validateIfsc(fullIfsc, matched);
        setFieldErrors((prev) => ({ ...prev, ifscCode: ifscRes.valid ? '' : ifscRes.error }));
        if (ifscRes.valid) triggerBranchLookup(fullIfsc, matched);
      }
    } else {
      // Custom bank or no match
      const wasSupported = selectedBank !== null;
      if (wasSupported) {
        setSelectedBank(null);
        // Requirement 5: Clear or revalidate the previous IFSC values when the selected bank changes.
        // Never silently retain an old bank's IFSC prefix.
        setCustomIfscPrefix('');
        setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
        setBankForm((prev) => ({ ...prev, bankName: val, ifscCode: '' }));
        // Revalidate account number with general 9-18 range
        if (bankForm.accountNumber) {
          const acctRes = validateAccountNumber(bankForm.accountNumber, null);
          setFieldErrors((prev) => ({
            ...prev,
            bankName: nameError,
            accountNumber: acctRes.valid ? '' : acctRes.error,
            ifscCode: ifscBranchSuffix ? 'Please enter the first 4 alphabetic characters of the bank code.' : ''
          }));
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            bankName: nameError,
            ifscCode: ifscBranchSuffix ? 'Please enter the first 4 alphabetic characters of the bank code.' : ''
          }));
        }
      } else {
        setBankForm((prev) => ({ ...prev, bankName: val }));
        setFieldErrors((prev) => ({ ...prev, bankName: nameError }));
      }
    }
  };

  // Bank Name Input Blur
  const handleBankBlur = () => {
    setFieldTouched((prev) => ({ ...prev, bankName: true }));
    setTimeout(() => {
      setIsBankDropdownOpen(false);
      const val = bankForm.bankName.trim();
      if (!val) {
        setFieldErrors((prev) => ({
          ...prev,
          bankName: 'Bank name is required.'
        }));
      } else {
        const nameVal = validateBankName(val);
        if (!nameVal.valid) {
          setFieldErrors((prev) => ({
            ...prev,
            bankName: nameVal.error
          }));
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            bankName: ''
          }));
        }
      }
    }, 250);
  };

  // Account Number Change (Digits Only, Bank-Specific Length restricted)
  const handleAccountNumberChange = (e) => {
    const raw = e.target.value;
    const maxLen = selectedBank ? selectedBank.accountLength.max : 18;
    const cleanDigits = sanitizeAccountNumber(raw, maxLen);

    setBankForm((prev) => ({ ...prev, accountNumber: cleanDigits }));
    setFieldTouched((prev) => ({ ...prev, accountNumber: true }));

    if (selectedBank) {
      if (cleanDigits.length > 0) {
        const res = validateAccountNumber(cleanDigits, selectedBank);
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: res.valid ? '' : res.error
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: fieldTouched.accountNumber ? 'Account number is required.' : ''
        }));
      }
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: 'Please select a supported bank first.'
      }));
    }

    if (bankForm.confirmAccountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: cleanDigits === bankForm.confirmAccountNumber ? '' : 'Account numbers do not match.'
      }));
    }
  };

  // Account Number Paste (Digits Only)
  const handleAccountPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const maxLen = selectedBank ? selectedBank.accountLength.max : 18;
    const cleanDigits = sanitizeAccountNumber(pasted, maxLen);

    setBankForm((prev) => ({ ...prev, accountNumber: cleanDigits }));
    setFieldTouched((prev) => ({ ...prev, accountNumber: true }));

    if (selectedBank) {
      if (cleanDigits.length > 0) {
        const res = validateAccountNumber(cleanDigits, selectedBank);
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: res.valid ? '' : res.error
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: 'Account number is required.'
        }));
      }
    }
    if (bankForm.confirmAccountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: cleanDigits === bankForm.confirmAccountNumber ? '' : 'Account numbers do not match.'
      }));
    }
  };

  // Account Number Blur
  const handleAccountBlur = () => {
    setFieldTouched((prev) => ({ ...prev, accountNumber: true }));
    if (!bankForm.accountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: 'Account number is required.'
      }));
    } else if (selectedBank) {
      const res = validateAccountNumber(bankForm.accountNumber, selectedBank);
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: res.valid ? '' : res.error
      }));
    }
  };

  // Confirm Account Number Change (Digits Only)
  const handleConfirmAccountChange = (e) => {
    const raw = e.target.value;
    const maxLen = selectedBank ? selectedBank.accountLength.max : 18;
    const cleanDigits = sanitizeAccountNumber(raw, maxLen);

    setBankForm((prev) => ({ ...prev, confirmAccountNumber: cleanDigits }));
    setFieldTouched((prev) => ({ ...prev, confirmAccountNumber: true }));
    setPasteWarning('');

    if (cleanDigits.length > 0) {
      if (cleanDigits !== bankForm.accountNumber) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmAccountNumber: 'Account numbers do not match.'
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          confirmAccountNumber: ''
        }));
      }
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: fieldTouched.confirmAccountNumber ? 'Please confirm your account number.' : ''
      }));
    }
  };

  // Confirm Account Paste (Sanitize Digits Only)
  const handleConfirmPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const maxLen = selectedBank ? selectedBank.accountLength.max : 18;
    const cleanDigits = sanitizeAccountNumber(pasted, maxLen);

    setBankForm((prev) => ({ ...prev, confirmAccountNumber: cleanDigits }));
    setFieldTouched((prev) => ({ ...prev, confirmAccountNumber: true }));
    setPasteWarning('');

    if (cleanDigits.length > 0) {
      if (cleanDigits !== bankForm.accountNumber) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmAccountNumber: 'Account numbers do not match.'
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          confirmAccountNumber: ''
        }));
      }
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: 'Please confirm your account number.'
      }));
    }
  };

  // Confirm Account Blur
  const handleConfirmBlur = () => {
    setFieldTouched((prev) => ({ ...prev, confirmAccountNumber: true }));
    if (!bankForm.confirmAccountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: 'Please confirm your account number.'
      }));
    } else if (bankForm.confirmAccountNumber !== bankForm.accountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: 'Account numbers do not match.'
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber: ''
      }));
    }
  };

  // Trigger Branch Lookup
  const triggerBranchLookup = async (code, bank) => {
    if (code.length !== 11) return;

    const syncRes = validateIfsc(code, bank);
    if (!syncRes.valid) {
      setBranchStatus({
        loading: false,
        verified: false,
        branch: null,
        error: syncRes.error
      });
      setFieldErrors((prev) => ({ ...prev, ifscCode: syncRes.error }));
      return;
    }

    try {
      const res = await lookupIfscBranch(code, bank);
      if (res.valid) {
        setBranchStatus({
          loading: false,
          verified: true,
          demo: res.demo || false,
          branch: res.branch,
          message: res.statusMessage || 'IFSC format validated in demo mode.',
          error: ''
        });
        setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
      } else {
        setBranchStatus({
          loading: false,
          verified: false,
          branch: null,
          error: res.error || 'Invalid branch IFSC code.'
        });
        setFieldErrors((prev) => ({
          ...prev,
          ifscCode: res.error || 'Invalid branch IFSC code.'
        }));
      }
    } catch (_) {
      setBranchStatus({
        loading: false,
        verified: true,
        branch: { bankName: bank ? bank.name : 'Authorized Bank', branch: 'Valid Bank Branch Code', city: 'India', state: '' },
        message: 'IFSC format validated in demo mode.',
        error: ''
      });
    }
  };

  // Custom Bank Code Change (First 4 characters - Alphabets Only A-Z)
  const handleCustomPrefixChange = (e) => {
    const raw = e.target.value;
    const clean = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    setCustomIfscPrefix(clean);
    setFieldTouched((prev) => ({ ...prev, ifscCode: true }));

    const fullIfsc = clean || ifscBranchSuffix ? `${clean}0${ifscBranchSuffix}` : '';
    setBankForm((prev) => ({ ...prev, ifscCode: fullIfsc }));

    if (clean.length < 4) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the first 4 alphabetic characters of the bank code.'
      }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
      return;
    }

    if (ifscBranchSuffix.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the remaining 6 branch-code characters.'
      }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
      return;
    }

    const valRes = validateIfsc(fullIfsc, null);
    if (!valRes.valid) {
      setFieldErrors((prev) => ({ ...prev, ifscCode: valRes.error }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: valRes.error });
    } else {
      setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
      triggerBranchLookup(fullIfsc, null);
    }
  };

  // Branch Suffix Change (Remaining 6 characters - Alphanumeric A-Z, 0-9)
  const handleBranchSuffixChange = (e) => {
    const raw = e.target.value;
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setIfscBranchSuffix(clean);
    setFieldTouched((prev) => ({ ...prev, ifscCode: true }));

    const bankCode = selectedBank ? selectedBank.ifscPrefix : customIfscPrefix;
    const fullIfsc = bankCode || clean ? `${bankCode || ''}0${clean}` : '';
    setBankForm((prev) => ({ ...prev, ifscCode: fullIfsc }));

    if (!selectedBank && (!bankCode || bankCode.length < 4)) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the first 4 alphabetic characters of the bank code.'
      }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
      return;
    }

    if (clean.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the remaining 6 branch-code characters.'
      }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: '' });
      return;
    }

    const valRes = validateIfsc(fullIfsc, selectedBank);
    if (!valRes.valid) {
      setFieldErrors((prev) => ({ ...prev, ifscCode: valRes.error }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: valRes.error });
    } else {
      setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
      triggerBranchLookup(fullIfsc, selectedBank);
    }
  };

  // IFSC Paste (Smart parsing of 11-char full IFSC or 6-char branch code)
  const handleIfscPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const clean = sanitizeIfscInput(pasted);

    if (!clean) return;
    setFieldTouched((prev) => ({ ...prev, ifscCode: true }));

    if (clean.length === 11 && clean[4] === '0') {
      const codePart = clean.slice(0, 4);
      const branchPart = clean.slice(5, 11);

      if (selectedBank) {
        if (codePart === selectedBank.ifscPrefix) {
          setIfscBranchSuffix(branchPart);
          const full = `${selectedBank.ifscPrefix}0${branchPart}`;
          setBankForm((prev) => ({ ...prev, ifscCode: full }));
          setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
          triggerBranchLookup(full, selectedBank);
        } else {
          setIfscBranchSuffix(branchPart);
          const full = `${selectedBank.ifscPrefix}0${branchPart}`;
          setBankForm((prev) => ({ ...prev, ifscCode: full }));
          setFieldErrors((prev) => ({
            ...prev,
            ifscCode: 'IFSC code does not match the selected bank.'
          }));
        }
      } else {
        setCustomIfscPrefix(codePart);
        setIfscBranchSuffix(branchPart);
        const full = `${codePart}0${branchPart}`;
        setBankForm((prev) => ({ ...prev, ifscCode: full }));
        const valRes = validateIfsc(full, null);
        if (!valRes.valid) {
          setFieldErrors((prev) => ({ ...prev, ifscCode: valRes.error }));
        } else {
          setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
          triggerBranchLookup(full, null);
        }
      }
    } else if (clean.length <= 6) {
      setIfscBranchSuffix(clean);
      const bankCode = selectedBank ? selectedBank.ifscPrefix : customIfscPrefix;
      const full = `${bankCode || ''}0${clean}`;
      setBankForm((prev) => ({ ...prev, ifscCode: full }));
      if (clean.length < 6) {
        setFieldErrors((prev) => ({
          ...prev,
          ifscCode: 'Please enter the remaining 6 branch-code characters.'
        }));
      } else {
        const valRes = validateIfsc(full, selectedBank);
        setFieldErrors((prev) => ({ ...prev, ifscCode: valRes.valid ? '' : valRes.error }));
        if (valRes.valid) triggerBranchLookup(full, selectedBank);
      }
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'IFSC code must contain exactly 11 characters.'
      }));
    }
  };

  // IFSC Blur
  const handleIfscBlur = () => {
    setFieldTouched((prev) => ({ ...prev, ifscCode: true }));
    const bankCode = selectedBank ? selectedBank.ifscPrefix : customIfscPrefix;
    const fullIfsc = `${bankCode || ''}0${ifscBranchSuffix}`;

    if (!selectedBank && (!bankCode || bankCode.length < 4)) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the first 4 alphabetic characters of the bank code.'
      }));
      return;
    }

    if (ifscBranchSuffix.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        ifscCode: 'Please enter the remaining 6 branch-code characters.'
      }));
      return;
    }

    const syncRes = validateIfsc(fullIfsc, selectedBank);
    if (!syncRes.valid) {
      setFieldErrors((prev) => ({ ...prev, ifscCode: syncRes.error }));
      setBranchStatus({ loading: false, verified: false, branch: null, error: syncRes.error });
    } else {
      setFieldErrors((prev) => ({ ...prev, ifscCode: '' }));
      triggerBranchLookup(fullIfsc, selectedBank);
    }
  };

  // Live Validity Check
  const isBankNameValid =
    Boolean(bankForm.bankName) &&
    validateBankName(bankForm.bankName).valid;

  const isAccountNumberValid =
    Boolean(bankForm.accountNumber) &&
    validateAccountNumber(bankForm.accountNumber, selectedBank).valid;

  const isConfirmAccountValid =
    isAccountNumberValid &&
    Boolean(bankForm.confirmAccountNumber) &&
    bankForm.confirmAccountNumber === bankForm.accountNumber;

  const activeBankCode = selectedBank ? selectedBank.ifscPrefix : customIfscPrefix;
  const currentFullIfsc = activeBankCode && ifscBranchSuffix
    ? `${activeBankCode}0${ifscBranchSuffix}`
    : '';

  const isIfscValid =
    currentFullIfsc.length === 11 &&
    validateIfsc(currentFullIfsc, selectedBank).valid &&
    !branchStatus.error;

  const isFormValid =
    isBankNameValid &&
    isAccountNumberValid &&
    isConfirmAccountValid &&
    isIfscValid;

  // Filtered banks for autocomplete dropdown
  const filteredBanks = searchBanks(bankSearchQuery);
  const filteredGroupedBanks = groupBanksByCategory(filteredBanks);

  // Step 1: Initiate Linking
  const handleInitiate = async (e) => {
    e.preventDefault();
    setFormError('');

    // Mark all as touched
    setFieldTouched({
      bankName: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifscCode: true
    });

    const bankNameVal = validateBankName(bankForm.bankName);
    if (!bankNameVal.valid) {
      setFormError(bankNameVal.error);
      return;
    }

    const acctRes = validateAccountNumber(bankForm.accountNumber, selectedBank);
    if (!acctRes.valid) {
      setFormError(acctRes.error);
      return;
    }

    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setFormError('Account number and confirmation account number do not match.');
      return;
    }

    const fullIfsc = selectedBank
      ? `${selectedBank.ifscPrefix}0${ifscBranchSuffix}`
      : `${customIfscPrefix}0${ifscBranchSuffix}`;

    const ifscRes = validateIfsc(fullIfsc, selectedBank);
    if (!ifscRes.valid) {
      setFormError(ifscRes.error);
      return;
    }

    if (branchStatus.error) {
      setFormError(branchStatus.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bankAccountService.linkAccount({
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        confirmAccountNumber: bankForm.confirmAccountNumber.trim(),
        ifscCode: fullIfsc.trim().toUpperCase(),
        accountHolderName: bankForm.accountHolderName.trim() || undefined,
        isPrimary: bankForm.isPrimary,
        deliveryMethod: selectedDeliveryMethod || 'email'
      });

      setPendingAccountId(res.data.bankAccountId);
      setRegisteredPhoneEnding(res.data.registeredMobileLast4 || '');
      setMaskedMobile(res.data.maskedMobile || '');
      setMaskedEmail(res.data.maskedEmail || '');
      setDeliveryMethod(res.data.deliveryMethod || selectedDeliveryMethod || 'email');
      setSmsDeliveryInfo(res.data.smsDelivery || null);
      setOtpValue('');
      setOtpDigits(['', '', '', '', '', '']);
      setResendMessage('');
      startCooldownTimer(res.data.resendCooldown || 30);
      setStep(2);
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 150);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to initiate bank linking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Helper: Individual OTP Digit Change
  const handleOtpDigitChange = (index, val) => {
    const clean = val.replace(/\D/g, '');
    const char = clean.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    const joined = updated.join('');
    setOtpValue(joined);
    setFormError('');

    // Advance focus to next digit box
    if (char && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  // Step 2 Helper: Key Down (Backspace handling)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && otpInputsRef.current[index - 1]) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        setOtpValue(updated.join(''));
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  // Step 2 Helper: Paste Complete 6-Digit OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);
    setOtpValue(updated.join(''));
    setFormError('');

    const nextFocusIdx = Math.min(pasted.length, 5);
    if (otpInputsRef.current[nextFocusIdx]) {
      otpInputsRef.current[nextFocusIdx].focus();
    }
  };

  // Step 2: Resend Verification Code (Supports both SMS and Email delivery)
  const handleResendOtp = async (targetMethod = deliveryMethod) => {
    const isChannelSwitch = targetMethod !== deliveryMethod;
    if (!isChannelSwitch && resendCooldown > 0) return;
    if (isResending || !pendingAccountId) return;
    setIsResending(true);
    setFormError('');
    setResendMessage('');

    try {
      const res = await bankAccountService.resendOtp(pendingAccountId, targetMethod);
      setDeliveryMethod(res.data?.deliveryMethod || targetMethod);
      if (res.data?.maskedEmail) setMaskedEmail(res.data.maskedEmail);
      if (res.data?.maskedMobile) setMaskedMobile(res.data.maskedMobile);
      if (res.data?.registeredMobileLast4) setRegisteredPhoneEnding(res.data.registeredMobileLast4);
      setSmsDeliveryInfo(res.data?.smsDelivery || null);
      setOtpValue('');
      setOtpDigits(['', '', '', '', '', '']);
      startCooldownTimer(res.data?.resendCooldown || 30);
      setResendMessage(res.message || 'A new verification code has been dispatched.');
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!otpValue || otpValue.trim().length !== 6) {
      setFormError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bankAccountService.verifyAccount({
        bankAccountId: pendingAccountId,
        otp: otpValue.trim()
      });

      setBannerSuccess(res.message || 'Bank account verified and linked successfully in demo mode!');
      closeModal();
      await loadBankAccounts();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to verify bank account OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unlink Bank Account
  const handleUnlink = async () => {
    if (!confirmUnlinkModal) return;
    setIsSubmitting(true);
    setBannerError('');
    setBannerSuccess('');

    try {
      const res = await bankAccountService.unlinkAccount(confirmUnlinkModal.id);
      setBannerSuccess(res.message || 'Bank account unlinked successfully.');
      setConfirmUnlinkModal(null);
      await loadBankAccounts();
    } catch (err) {
      setBannerError(err.response?.data?.message || err.message || 'Failed to unlink bank account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set Primary Bank Account
  const handleSetPrimary = async (accountId) => {
    setIsSubmitting(true);
    setBannerError('');
    setBannerSuccess('');

    try {
      const res = await bankAccountService.setPrimaryAccount(accountId);
      setBannerSuccess(res.message || 'Primary bank account updated successfully.');
      await loadBankAccounts();
    } catch (err) {
      setBannerError(err.response?.data?.message || err.message || 'Failed to update primary bank account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (showModal) {
      closeModal();
      return;
    }
    if (confirmUnlinkModal) {
      setConfirmUnlinkModal(null);
      return;
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/app');
    }
  };

  return (
    <DashboardLayout
      title="Bank Account Management"
      subtitle="Manage your linked verified bank accounts, primary settlement account, and IFSC routing"
      backFallback="/app"
      onBack={handleBack}
      onRefresh={loadBankAccounts}
    >
      {/* Page Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
            Linked Accounts ({bankAccounts.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '2px 0 0' }}>
            All linked accounts are encrypted with AES-256 and verified through banking rails.
          </p>
        </div>

        <button
          onClick={openLinkModal}
          className="auth-button"
          style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusIcon size={16} />
          <span>Link New Bank Account</span>
        </button>
      </div>

      {/* Global Alerts */}
      {bannerSuccess && (
        <div className="auth-alert success" style={{ marginBottom: '20px' }}>
          <CheckCircleIcon size={16} />
          <span>{bannerSuccess}</span>
        </div>
      )}
      {bannerError && (
        <div className="auth-alert error" style={{ marginBottom: '20px' }}>
          <AlertCircleIcon size={16} />
          <span>{bannerError}</span>
        </div>
      )}

      {/* Linked Bank Accounts Cards */}
      {loading ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '36px', color: '#A9BDD7' }}>
          Loading your linked bank accounts...
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(22, 119, 255, 0.1)', border: '1px solid rgba(22, 119, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#00A8FF' }}>
            <BankIcon size={30} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
            No Bank Accounts Linked Yet
          </h3>
          <p style={{ color: '#A9BDD7', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px' }}>
            Link your savings or current bank account to activate UPI handles, receive funds, and withdraw wallet balance.
          </p>
          <button
            onClick={openLinkModal}
            className="auth-button"
            style={{ width: 'auto', padding: '0 22px', height: '42px', fontSize: '14px', margin: '0 auto' }}
          >
            + Link Your First Bank Account
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className="dashboard-card"
              style={{
                margin: 0,
                border: `1.5px solid ${account.isPrimary ? '#087BFF' : '#17385D'}`,
                background: account.isPrimary
                  ? 'linear-gradient(180deg, rgba(22, 119, 255, 0.08) 0%, rgba(10, 20, 34, 0.95) 100%)'
                  : 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 166, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A8FF' }}>
                      <BankIcon size={18} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>
                      {account.bankName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {account.status === 'demo_verified' && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#F59E0B',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}
                        title="Mobile verified in ApnaPay demo mode. Bank ownership verification pending."
                      >
                        ● Demo Verified
                      </span>
                    )}
                    {account.isPrimary ? (
                      <span style={{ fontSize: '11px', background: 'rgba(22, 119, 255, 0.25)', border: '1px solid #087BFF', color: '#00A8FF', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
                        PRIMARY
                      </span>
                    ) : (
                      account.status !== 'demo_verified' && (
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>
                          ● Active
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Masked Account Number */}
                <div style={{ margin: '14px 0' }}>
                  <div style={{ fontSize: '11px', color: '#A9BDD7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Account Number
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '2px', color: '#FFFFFF', marginTop: '2px' }}>
                    {account.maskedAccountNumber || `••••••••${account.accountLast4}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#A9BDD7' }}>
                  <span>IFSC: <strong style={{ color: '#FFFFFF' }}>{account.ifscCode}</strong></span>
                  <span>Holder: <strong style={{ color: '#FFFFFF' }}>{account.accountHolderName}</strong></span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #162438', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Linked on {new Date(account.createdAt).toLocaleDateString()}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!account.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(account.id)}
                      disabled={isSubmitting}
                      title="Set this account as Primary"
                      style={{
                        background: 'rgba(0, 166, 255, 0.1)',
                        border: '1px solid rgba(0, 166, 255, 0.25)',
                        color: '#00A8FF',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}
                    >
                      Set Primary
                    </button>
                  )}

                  <button
                    onClick={() => setConfirmUnlinkModal(account)}
                    title="Unlink Account"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    <TrashIcon size={14} />
                    <span>Unlink</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: LINK NEW BANK ACCOUNT                           */}
      {/* ======================================================== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '490px' }}>
            <div className="modal-header" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: 'rgba(0, 166, 255, 0.1)', borderRadius: '8px', color: '#00A8FF' }}>
                  {step === 1 ? <BankIcon size={20} /> : <LockIcon size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    {step === 1 ? 'Link Bank Account' : 'Verify Your Mobile Number'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                    {step === 1
                      ? 'Enter your bank details to initiate verification'
                      : `Enter the 6-digit code sent to your registered mobile ending in ${registeredPhoneEnding || 'XXXX'}`}
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer', padding: '4px' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 18px 14px' }}>
              {isDemoMode() && step === 1 && (
                <div style={{ background: 'rgba(0, 166, 255, 0.08)', border: '1px solid rgba(0, 166, 255, 0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#A9BDD7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <InfoIcon size={15} style={{ color: '#00A8FF', flexShrink: 0 }} />
                  <span>
                    <strong>Demo Mode:</strong> Telecom SMS and paid banking APIs are simulated. Bank linking verification will be completed using your registered email OTP.
                  </span>
                </div>
              )}

              {formError && (
                <div className="auth-alert error" style={{ marginBottom: '14px', padding: '10px 12px', fontSize: '12.5px' }}>
                  <AlertCircleIcon size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleInitiate} noValidate>
                  {/* 1. BANK NAME (Editable Input with Autocomplete Suggestions) */}
                  <div style={{ marginBottom: '13px', position: 'relative' }} ref={bankDropdownRef}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '13px', color: '#A9BDD7', fontWeight: '500' }}>
                        Bank Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      {selectedBank ? (
                        <span style={{ fontSize: '11.5px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                          <CheckCircleIcon size={12} />
                          {selectedBank.name}
                        </span>
                      ) : isBankNameValid ? (
                        <span style={{ fontSize: '11px', color: '#00D5FF', fontWeight: '500' }}>
                          Custom Bank
                        </span>
                      ) : null}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input no-left-icon"
                        placeholder="Type or select bank name (e.g. State Bank of India, HDFC Bank, ABCD)..."
                        value={bankForm.bankName}
                        onFocus={() => setIsBankDropdownOpen(true)}
                        onChange={handleBankNameChange}
                        onBlur={handleBankBlur}
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '38px',
                          height: '44px',
                          fontSize: '13.5px',
                          borderColor: fieldTouched.bankName && fieldErrors.bankName ? '#EF4444' : isBankNameValid ? '#10B981' : '#17385D'
                        }}
                        autoComplete="off"
                        required
                      />
                      <div
                        onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#A9BDD7',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                      >
                        <ChevronDownIcon size={16} />
                      </div>
                    </div>

                    {/* Autocomplete Dropdown List - Displaying Matching Supported Banks */}
                    {isBankDropdownOpen && (
                      <div className="bank-dropdown-menu">
                        {/* Government Banks */}
                        {filteredGroupedBanks.government.length > 0 && (
                          <div>
                            <div className="bank-dropdown-header govt">
                              <span>Government Banks</span>
                            </div>
                            {filteredGroupedBanks.government.map((bank) => {
                              const isChosen = selectedBank?.id === bank.id;
                              return (
                                <div
                                  key={bank.id}
                                  onMouseDown={() => handleSelectBank(bank)}
                                  className={`bank-suggestion-item ${isChosen ? 'active' : ''}`}
                                  style={{
                                    padding: '10px 14px',
                                    background: isChosen ? 'rgba(0, 168, 255, 0.15)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span style={{ fontSize: '13.5px', fontWeight: isChosen ? '600' : '500', color: isChosen ? '#00A8FF' : '#FFFFFF' }}>
                                    {bank.name}
                                  </span>
                                  {isChosen && (
                                    <CheckIcon size={14} style={{ color: '#00A8FF' }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Private Banks */}
                        {filteredGroupedBanks.private.length > 0 && (
                          <div>
                            <div className="bank-dropdown-header private" style={{ borderTop: filteredGroupedBanks.government.length > 0 ? '1px solid #162438' : 'none' }}>
                              <span>Private Banks</span>
                            </div>
                            {filteredGroupedBanks.private.map((bank) => {
                              const isChosen = selectedBank?.id === bank.id;
                              return (
                                <div
                                  key={bank.id}
                                  onMouseDown={() => handleSelectBank(bank)}
                                  className={`bank-suggestion-item ${isChosen ? 'active' : ''}`}
                                  style={{
                                    padding: '10px 14px',
                                    background: isChosen ? 'rgba(0, 168, 255, 0.15)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span style={{ fontSize: '13.5px', fontWeight: isChosen ? '600' : '500', color: isChosen ? '#00A8FF' : '#FFFFFF' }}>
                                    {bank.name}
                                  </span>
                                  {isChosen && (
                                    <CheckIcon size={14} style={{ color: '#00A8FF' }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {filteredGroupedBanks.government.length === 0 && filteredGroupedBanks.private.length === 0 && (
                          <div style={{ padding: '14px', textAlign: 'center', color: '#A9BDD7', fontSize: '12px' }}>
                            No supported bank found matching "{bankForm.bankName}". You can continue with "{bankForm.bankName}" as a custom bank.
                          </div>
                        )}
                      </div>
                    )}

                    {fieldTouched.bankName && fieldErrors.bankName && (
                      <div className="field-status-msg error" style={{ marginTop: '4px' }}>
                        <AlertCircleIcon size={14} />
                        <span>{fieldErrors.bankName}</span>
                      </div>
                    )}
                  </div>

                  {/* 2. ACCOUNT NUMBER (Bank-Wise Rules & Digits Only) */}
                  <div style={{ marginBottom: '13px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '5px', fontWeight: '500' }}>
                      Account Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="form-input no-left-icon"
                      placeholder={selectedBank ? `Enter ${selectedBank.name} account number` : 'Enter bank account number'}
                      value={bankForm.accountNumber}
                      onChange={handleAccountNumberChange}
                      onPaste={handleAccountPaste}
                      onBlur={handleAccountBlur}
                      maxLength={selectedBank?.accountLength?.max || 18}
                      style={{
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        height: '44px',
                        fontSize: '13.5px',
                        borderColor: fieldTouched.accountNumber && fieldErrors.accountNumber ? '#EF4444' : isAccountNumberValid ? '#10B981' : '#17385D'
                      }}
                      required
                    />

                    {fieldTouched.accountNumber && fieldErrors.accountNumber && (
                      <div className="field-status-msg error" style={{ marginTop: '4px' }}>
                        <AlertCircleIcon size={14} />
                        <span>{fieldErrors.accountNumber}</span>
                      </div>
                    )}

                    {isAccountNumberValid && (
                      <div className="field-status-msg success" style={{ marginTop: '4px' }}>
                        <CheckCircleIcon size={14} />
                        <span>Valid account length ({bankForm.accountNumber.length} digits)</span>
                      </div>
                    )}
                  </div>

                  {/* 3. CONFIRM ACCOUNT NUMBER (Match Validation & Anti-Paste Protection) */}
                  <div style={{ marginBottom: '13px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '5px', fontWeight: '500' }}>
                      Confirm Account Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="form-input no-left-icon"
                      placeholder="Re-enter bank account number"
                      value={bankForm.confirmAccountNumber}
                      onChange={handleConfirmAccountChange}
                      onPaste={handleConfirmPaste}
                      onBlur={handleConfirmBlur}
                      maxLength={selectedBank?.accountLength?.max || 18}
                      style={{
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        height: '44px',
                        fontSize: '13.5px',
                        borderColor: fieldTouched.confirmAccountNumber && fieldErrors.confirmAccountNumber ? '#EF4444' : isConfirmAccountValid ? '#10B981' : '#17385D'
                      }}
                      required
                    />

                    {pasteWarning && (
                      <div className="field-status-msg warning" style={{ marginTop: '4px' }}>
                        <InfoIcon size={14} />
                        <span>{pasteWarning}</span>
                      </div>
                    )}

                    {fieldTouched.confirmAccountNumber && fieldErrors.confirmAccountNumber && (
                      <div className="field-status-msg error" style={{ marginTop: '4px' }}>
                        <AlertCircleIcon size={14} />
                        <span>{fieldErrors.confirmAccountNumber}</span>
                      </div>
                    )}

                    {isConfirmAccountValid && (
                      <div className="field-status-msg success" style={{ marginTop: '4px' }}>
                        <CheckCircleIcon size={14} />
                        <span>Account numbers match</span>
                      </div>
                    )}
                  </div>

                  {/* 4. IFSC CODE (Structure: [4-char Bank Code] + [Fixed 0] + [6-char Branch Code]) */}
                  <div style={{ marginBottom: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '13px', color: '#A9BDD7', fontWeight: '500' }}>
                        IFSC Code <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      {selectedBank ? (
                        <span style={{ fontSize: '11px', color: '#00D5FF', fontWeight: '600' }}>
                          Fixed Prefix: {selectedBank.ifscPrefix}0
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#A9BDD7', fontWeight: '500' }}>
                          Format: [Bank: 4 letters] [0] [Branch: 6 chars]
                        </span>
                      )}
                    </div>

                    {/* Visual Segmented IFSC Input */}
                    {selectedBank ? (
                      /* Case A: Supported Bank - First 5 characters (PREFIX + 0) are FIXED & NON-EDITABLE */
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'stretch',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: `1.5px solid ${fieldTouched.ifscCode && fieldErrors.ifscCode ? '#EF4444' : isIfscValid ? '#10B981' : '#17385D'}`
                        }}
                      >
                        {/* Fixed Non-Editable Prefix Box */}
                        <div
                          title={`Configured ${selectedBank.name} code and fixed 5th character '0' (non-editable)`}
                          style={{
                            background: 'rgba(0, 168, 255, 0.12)',
                            borderRight: '1.5px solid #17385D',
                            padding: '0 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#00D5FF',
                            fontWeight: '700',
                            fontSize: '13.5px',
                            letterSpacing: '1.5px',
                            userSelect: 'none'
                          }}
                        >
                          <span>{selectedBank.ifscPrefix}0</span>
                          <span style={{ fontSize: '10px', background: 'rgba(0, 213, 255, 0.2)', padding: '1px 5px', borderRadius: '4px', color: '#00D5FF', fontWeight: '600', letterSpacing: '0' }}>
                            FIXED
                          </span>
                        </div>

                        {/* Editable 6 Branch Characters Input */}
                        <input
                          type="text"
                          placeholder="Enter 6-character branch code (e.g. 001234)"
                          value={ifscBranchSuffix}
                          onChange={handleBranchSuffixChange}
                          onPaste={handleIfscPaste}
                          onBlur={handleIfscBlur}
                          maxLength={6}
                          style={{
                            flex: 1,
                            height: '44px',
                            padding: '0 14px',
                            background: '#0B172E',
                            border: 'none',
                            outline: 'none',
                            color: '#FFFFFF',
                            fontSize: '13.5px',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}
                          required
                        />
                      </div>
                    ) : (
                      /* Case B: Custom Bank - First 4 alphabetic editable + 5th '0' fixed + 6 branch characters editable */
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'stretch',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: `1.5px solid ${fieldTouched.ifscCode && fieldErrors.ifscCode ? '#EF4444' : isIfscValid ? '#10B981' : '#17385D'}`
                        }}
                      >
                        {/* 1. Editable Bank Code (4 alphabetic characters) */}
                        <input
                          type="text"
                          placeholder="AAAA"
                          value={customIfscPrefix}
                          onChange={handleCustomPrefixChange}
                          onPaste={handleIfscPaste}
                          onBlur={handleIfscBlur}
                          maxLength={4}
                          title="First 4 alphabetic characters of bank code"
                          style={{
                            width: '80px',
                            textAlign: 'center',
                            height: '44px',
                            padding: '0 8px',
                            background: '#0B172E',
                            border: 'none',
                            borderRight: '1px solid #17385D',
                            outline: 'none',
                            color: '#FFFFFF',
                            fontSize: '13.5px',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontWeight: '700'
                          }}
                          required
                        />

                        {/* 2. Fixed 5th character '0' (non-editable) */}
                        <div
                          title="5th character of Indian IFSC is always fixed as 0"
                          style={{
                            background: 'rgba(0, 168, 255, 0.12)',
                            borderRight: '1px solid #17385D',
                            padding: '0 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#00D5FF',
                            fontWeight: '800',
                            fontSize: '15px',
                            userSelect: 'none'
                          }}
                        >
                          0
                        </div>

                        {/* 3. Editable Branch Code (6 alphanumeric characters) */}
                        <input
                          type="text"
                          placeholder="Branch code (6 chars, e.g. 123456)"
                          value={ifscBranchSuffix}
                          onChange={handleBranchSuffixChange}
                          onPaste={handleIfscPaste}
                          onBlur={handleIfscBlur}
                          maxLength={6}
                          title="Remaining 6 branch-code characters"
                          style={{
                            flex: 1,
                            height: '44px',
                            padding: '0 14px',
                            background: '#0B172E',
                            border: 'none',
                            outline: 'none',
                            color: '#FFFFFF',
                            fontSize: '13.5px',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}
                          required
                        />
                      </div>
                    )}

                    {branchStatus.loading && (
                      <div className="field-status-msg info" style={{ marginTop: '4px' }}>
                        <InfoIcon size={14} />
                        <span>{isDemoMode() ? 'Validating IFSC format in demo mode...' : 'Verifying branch IFSC against RBI registry...'}</span>
                      </div>
                    )}

                    {fieldTouched.ifscCode && fieldErrors.ifscCode && (
                      <div className="field-status-msg error" style={{ marginTop: '4px' }}>
                        <AlertCircleIcon size={14} />
                        <span>{fieldErrors.ifscCode}</span>
                      </div>
                    )}

                    {isIfscValid && (
                      <div className="field-status-msg success" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '6px 10px', marginTop: '5px' }}>
                        <CheckCircleIcon size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '11.5px', color: '#86efac' }}>
                          Complete IFSC: <strong>{currentFullIfsc}</strong> • {branchStatus.message || 'IFSC format validated in demo mode.'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verification Channel Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A9BDD7', marginBottom: '8px' }}>
                      Verification Channel
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDeliveryMethod('email')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${selectedDeliveryMethod === 'email' ? '#00A8FF' : '#17385D'}`,
                          background: selectedDeliveryMethod === 'email' ? 'rgba(0, 168, 255, 0.12)' : '#071426',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>✉</span>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '600', color: selectedDeliveryMethod === 'email' ? '#00A8FF' : '#FFFFFF' }}>Registered Email</div>
                          <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Instant OTP to Inbox</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDeliveryMethod('sms')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${selectedDeliveryMethod === 'sms' ? '#00A8FF' : '#17385D'}`,
                          background: selectedDeliveryMethod === 'sms' ? 'rgba(0, 168, 255, 0.12)' : '#071426',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>📱</span>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '600', color: selectedDeliveryMethod === 'sms' ? '#00A8FF' : '#FFFFFF' }}>Mobile SMS</div>
                          <div style={{ fontSize: '11px', color: '#A9BDD7' }}>OTP to Phone</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Primary Toggle */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#FFFFFF' }}>
                      <input
                        type="checkbox"
                        checked={bankForm.isPrimary}
                        onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                      />
                      <span>Set this account as Primary for payouts and settlements</span>
                    </label>
                  </div>

                  <div className="modal-footer" style={{ padding: '12px 0 0 0', marginTop: '6px', borderTop: '1px solid #162438', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '13px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                      className="auth-button"
                      style={{
                        width: 'auto',
                        padding: '0 22px',
                        height: '40px',
                        fontSize: '13px',
                        opacity: (!isFormValid || isSubmitting) ? 0.5 : 1,
                        cursor: (!isFormValid || isSubmitting) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmitting ? 'Validating...' : 'Continue to Verification'}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: VERIFICATION OTP */
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0, 166, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#00A8FF' }}>
                      <LockIcon size={22} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      {deliveryMethod === 'email' ? 'Verify via Registered Email' : 'Verify Your Mobile Number'}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#A9BDD7', margin: '6px 0 0', lineHeight: 1.5 }}>
                      {deliveryMethod === 'email' ? (
                        <>
                          Enter the 6-digit verification code sent to your registered email <strong style={{ color: '#FFFFFF' }}>{maskedEmail || 'address'}</strong>.
                        </>
                      ) : (
                        <>
                          Enter the 6-digit verification code sent to your registered mobile number ending in <strong style={{ color: '#FFFFFF' }}>{registeredPhoneEnding || 'XXXX'}</strong>.
                        </>
                      )}
                    </p>
                  </div>

                  {resendMessage && (
                    <div className="auth-alert success" style={{ marginBottom: '14px', padding: '9px 12px', fontSize: '12.5px' }}>
                      <CheckCircleIcon size={15} />
                      <span>{resendMessage}</span>
                    </div>
                  )}

                  {/* Delivery Status Indicator */}
                  {deliveryMethod === 'email' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '20px', padding: '6px 16px', margin: '0 auto 16px', width: 'fit-content', fontSize: '12px', color: '#86efac' }}>
                      <CheckCircleIcon size={14} />
                      <span>Verification code sent to registered email <strong>{maskedEmail}</strong></span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(0, 168, 255, 0.1)', border: '1px solid rgba(0, 168, 255, 0.25)', borderRadius: '20px', padding: '6px 16px', margin: '0 auto 16px', width: 'fit-content', fontSize: '12px', color: '#7dd3fc' }}>
                      <CheckCircleIcon size={14} />
                      <span>Verification code sent to mobile ending in <strong>{registeredPhoneEnding || 'XXXX'}</strong></span>
                    </div>
                  )}

                  {/* 6-Digit Segmented OTP Input */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', color: '#A9BDD7', textAlign: 'center', marginBottom: '10px', fontWeight: '500' }}>
                      Enter 6-Digit OTP
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }} onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          style={{
                            width: '42px',
                            height: '48px',
                            borderRadius: '8px',
                            border: `1.5px solid ${digit ? '#00A8FF' : '#17385D'}`,
                            background: '#071426',
                            color: '#FFFFFF',
                            fontSize: '20px',
                            fontWeight: '700',
                            textAlign: 'center',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            boxShadow: digit ? '0 0 0 2px rgba(0, 166, 255, 0.15)' : 'none'
                          }}
                          autoFocus={idx === 0}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend OTP & Countdown Timer */}
                  <div style={{ textAlign: 'center', marginBottom: '14px', fontSize: '12.5px' }}>
                    {resendCooldown > 0 ? (
                      <span style={{ color: '#A9BDD7' }}>
                        Resend code in <strong style={{ color: '#00A8FF' }}>00:{String(resendCooldown).padStart(2, '0')}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResendOtp(deliveryMethod)}
                        disabled={isResending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00A8FF',
                          cursor: isResending ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12.5px',
                          textDecoration: 'underline'
                        }}
                      >
                        {isResending ? 'Sending new code...' : "Didn't receive code? Resend OTP"}
                      </button>
                    )}
                  </div>

                  {/* Alternative Delivery Method Switch (SMS <-> Email) */}
                  {deliveryMethod === 'sms' && maskedEmail ? (
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                      <button
                        type="button"
                        onClick={() => handleResendOtp('email')}
                        disabled={isResending}
                        style={{
                          background: 'rgba(0, 168, 255, 0.08)',
                          border: '1px solid rgba(0, 168, 255, 0.25)',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          color: '#00A8FF',
                          cursor: isResending ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✉ Switch to Registered Email ({maskedEmail}) instead
                      </button>
                    </div>
                  ) : deliveryMethod === 'email' ? (
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                      <button
                        type="button"
                        onClick={() => handleResendOtp('sms')}
                        disabled={isResending}
                        style={{
                          background: 'rgba(0, 168, 255, 0.08)',
                          border: '1px solid rgba(0, 168, 255, 0.25)',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          color: '#00A8FF',
                          cursor: isResending ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        📱 Switch to Mobile SMS ({registeredPhoneEnding ? `ending in ${registeredPhoneEnding}` : 'mobile'}) instead
                      </button>
                    </div>
                  ) : null}

                  <div className="modal-footer" style={{ padding: '12px 0 0 0', marginTop: '6px', borderTop: '1px solid #162438', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '13px' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || otpValue.length !== 6}
                      className="auth-button"
                      style={{ width: 'auto', padding: '0 22px', height: '40px', fontSize: '13px' }}
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify & Link Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONFIRM UNLINK                                 */}
      {/* ======================================================== */}
      {confirmUnlinkModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircleIcon size={18} />
                <span>Unlink Bank Account?</span>
              </h3>
              <button
                onClick={() => setConfirmUnlinkModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: '#FFFFFF', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to unlink{' '}
                <strong>{confirmUnlinkModal.bankName} (••••{confirmUnlinkModal.accountLast4})</strong>?
              </p>
              <p style={{ color: '#A9BDD7', fontSize: '12px', marginTop: '8px' }}>
                Any UPI handles linked to this bank will be disassociated until you assign another bank account.
              </p>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setConfirmUnlinkModal(null)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnlink}
                disabled={isSubmitting}
                style={{
                  background: '#EF4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 18px',
                  height: '38px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Unlinking...' : 'Confirm Unlink'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerBankAccountsPage;

