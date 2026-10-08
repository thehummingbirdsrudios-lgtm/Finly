// Finly reference components — props as documentation. Amounts are whole-rupee integers from the server.
import type * as React from 'react';

export type Direction = 'in' | 'out' | 'transfer' | 'none';
export type Visibility = 'full' | 'rounded' | 'range' | 'hidden' | 'existence';
export type Status = 'money-in' | 'money-out' | 'transfer' | 'draft' | 'pending' | 'posting' | 'posted' | 'rejected' | 'blocked'
  | 'reversed' | 'corrected' | 'outstanding' | 'settled' | 'reconciled' | 'exception' | 'overdue' | 'queued' | 'syncing' | 'sync-failed';
export type PrivacyLevel = 'private' | 'family' | 'business' | 'restricted' | 'shared';
export type Policy = 'optional' | 'default' | 'mandatory' | 'blocked';
export interface Option { id: string; title: string; subtitle?: string; icon?: string; disabled?: boolean; reason?: string }
export interface Tx { id?: string; from: string; to: string; amount: number; direction: Direction; reason?: string; date?: string; day?: string;
  time?: string; handler?: string; fund?: string; status?: Status; privacy?: PrivacyLevel; visibility?: Visibility; display?: string }
export interface Part { label: string; amount: number; visibility?: Visibility; display?: string }
export interface Row { label: string; value: React.ReactNode }
export interface Impact { area: string; before?: number | string; after: number | string }

export interface LogoProps { variant?: 'mark' | 'wordmark' | 'lockup'; size?: number; className?: string }
export interface IconProps { name: string; size?: number; label?: string; className?: string }
export interface MoneyProps { amount?: number; direction?: Direction; size?: 'hero' | 'lg' | 'md' | 'sm'; visibility?: Visibility; display?: string; struck?: boolean; className?: string }
export interface StatusBadgeProps { status: Status; label?: string }
export interface PrivacyBadgeProps { level: PrivacyLevel; label?: string; reason?: string }
export interface ButtonProps { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; size?: 'sm'; icon?: string; loading?: boolean; loadingLabel?: string;
  disabled?: boolean; block?: boolean; onClick?: () => void; children?: React.ReactNode }
export interface AddButtonProps { onClick?: () => void; extended?: boolean; label?: string }
export interface TextFieldProps { label: string; value?: string; defaultValue?: string; onChange?: (v: string) => void; placeholder?: string; helper?: string;
  error?: string; required?: boolean; icon?: string; multiline?: boolean; type?: string; inputMode?: string; autoComplete?: string; readOnly?: boolean }
export interface AmountInputProps { value?: number | null; defaultValue?: number | null; onChange?: (v: number | null) => void; label?: string;
  available?: number; availableLabel?: string; approvalAbove?: number; error?: string }
export interface SearchBarProps { value?: string; defaultValue?: string; onChange?: (v: string) => void; placeholder?: string;
  filters?: { id: string; label: string; selected?: boolean; icon?: string }[]; onToggleFilter?: (id: string) => void }
export interface ChipProps { label: string; selected?: boolean; onClick?: () => void; icon?: string; count?: number }
export interface SelectorProps { label: string; options: Option[]; value?: string | null; defaultValue?: string; onSelect?: (id: string) => void; placeholder?: string;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; recentLabel?: string; error?: string }
export interface TabsProps { tabs: { id: string; label: string; count?: number }[]; value?: string; defaultValue?: string; onChange?: (id: string) => void }
export interface TopBarProps { title: string; path?: string[]; onBack?: (() => void) | null; actions?: { icon: string; label: string; onClick?: () => void }[] }
export interface BottomNavProps { items?: { id: string; label: string; icon: string; badge?: number }[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; onAdd?: () => void }
export interface AddSheetProps { types?: Option[]; onPick?: (id: string) => void; repeat?: string; onRepeat?: () => void; onClose?: () => void }
export interface ListRowProps { title: string; subtitle?: string; icon?: string; trailing?: React.ReactNode; onClick?: () => void; disabled?: boolean; reason?: string }
export interface TransactionCardProps { tx: Tx; onClick?: () => void }
export interface BalanceCardProps { title: string; path?: string; amount: number; visibility?: Visibility; display?: string; parts?: Part[];
  privacy?: PrivacyLevel; updated?: string; stale?: boolean }
export interface FundCardProps { name: string; owner?: string; total: number; privacy?: PrivacyLevel;
  states: { available?: number; reserved?: number; allocated?: number; outstanding?: number; locked?: number } }
export interface OutstandingCardProps { title: string; subtitle?: string; original: number; settled: number; due?: string; overdue?: number; onSettle?: () => void }
export interface ExplainBalanceProps { title: string; from?: string; to?: string; opening: number; closing: number;
  movements: { label: string; ref?: string; amount: number; direction: 'in' | 'out' }[] }
export interface JournalLinesProps { entity: string; journalId?: string; lines: { account: string; side: 'Dr' | 'Cr'; amount: number; dims?: string }[] }
export interface DataTableProps { columns: { key: string; label: string; align?: 'end'; money?: boolean; figure?: boolean }[];
  rows: Record<string, React.ReactNode>[]; totals?: Record<string, React.ReactNode>; caption?: string }
export interface FindingCardProps { problem: string; reason: string; affected?: string[]; action: string; severity?: 'review' | 'critical'; when?: string;
  onReview?: () => void; onDismiss?: () => void }
export interface BottomSheetProps { title?: string; onClose?: (() => void) | null; actions?: React.ReactNode; modal?: boolean; children?: React.ReactNode }
export interface DialogProps { title: string; body?: string; icon?: string; tone?: 'danger'; actions?: React.ReactNode; children?: React.ReactNode }
export interface ImpactPreviewProps { items: Impact[]; hiddenCount?: number }
export interface ReviewSheetProps { title?: string; amount: number; direction?: Direction; directionLabel?: string; rows?: Row[]; impact?: Impact[]; hiddenImpact?: number;
  warnings?: string[]; stepUp?: boolean; posting?: boolean; confirmLabel?: string; onConfirm?: () => void; onEdit?: () => void; onClose?: () => void }
export interface ConflictMessageProps { title: string; what?: string; where?: string; why?: string; impact?: string; note?: string;
  resolutions?: { label: string; onClick?: () => void }[] }
export interface SnackbarProps { message: string; icon?: string; actionLabel?: string; onAction?: () => void }
export interface BannerProps { kind: 'offline' | 'syncing' | 'sync-failed' | 'stale' | 'read-only' | 'locked' | 'session' | 'timeout' | 'partial';
  text: string; actionLabel?: string; onAction?: () => void }
export interface SkeletonProps { rows?: number; label?: string }
export interface EmptyStateProps { title: string; body?: string; icon?: string; actionLabel?: string; actionIcon?: string; onAction?: () => void }
export interface AccessStateProps { kind: 'denied' | 'forbidden' | 'unauthorized'; title?: string; body?: string; actionLabel?: string; onAction?: () => void }
export interface PinPadProps { length?: 4 | 6; title?: string; hint?: string; onComplete?: (pin: string) => void; onBiometric?: () => void; onForgot?: () => void;
  error?: string; lockedFor?: string }
export interface OtpInputProps { length?: number; value?: string; onChange?: (v: string) => void; label?: string; helper?: string; error?: string }
export interface UnlockScreenProps { name?: string; method?: 'biometric' | 'pin'; onBiometric?: () => void; onForgot?: () => void; onPassword?: () => void; error?: string }
export interface StepUpSheetProps { action: string; reason?: string; failed?: boolean; onVerify?: () => void; onCancel?: () => void; onUsePin?: () => void }
export interface SecurityBuilderProps { policy?: Partial<Record<'password' | 'encryption' | 'watermark' | 'expiry' | 'viewer' | 'revocable' | 'identity'
  | 'download' | 'print' | 'verify' | 'stepup', Policy>>; expiry?: string }
export interface MessagePreviewProps { text: string }
export interface ShareConfirmProps { recipient: { name: string; contact?: string; verified?: boolean }; channel: string; format: string; security?: string[];
  content: React.ReactNode; invalidated?: boolean; onVerify?: () => void; onCancel?: () => void; onReview?: () => void }
export interface ProofCardProps { tx: Tx; firm?: string; classification?: string; watermark?: string; verifyCode?: string }
export interface PdfPageProps { title: string; entity: string; period: string; summary: { opening: number; credits: number; debits: number; closing: number };
  rows?: Record<string, React.ReactNode>[]; totals?: Record<string, React.ReactNode>; page?: number; pages?: number; docId?: string; generated?: string;
  classification?: string; watermark?: string }

export interface SplashScreenProps { state?: 'starting' | 'checking' | 'offline' | 'failed' | 'disabled' | 'locked'; code?: string; onPrimary?: () => void; onSecondary?: () => void }
export interface SetupWizardProps { steps: { id: string; title: string; description?: string; optional?: boolean }[]; current: string; title?: string; saved?: string; resumed?: boolean;
  nextLabel?: string; nextDisabled?: boolean; onBack?: () => void; onNext?: () => void; onSkip?: () => void; children?: React.ReactNode }

declare global {
  interface Window {
    Finly: {
      Logo: React.FC<LogoProps>; Icon: React.FC<IconProps>; Money: React.FC<MoneyProps>; StatusBadge: React.FC<StatusBadgeProps>; PrivacyBadge: React.FC<PrivacyBadgeProps>;
      Button: React.FC<ButtonProps>; AddButton: React.FC<AddButtonProps>; TextField: React.FC<TextFieldProps>; AmountInput: React.FC<AmountInputProps>;
      SearchBar: React.FC<SearchBarProps>; Chip: React.FC<ChipProps>; Selector: React.FC<SelectorProps>; Tabs: React.FC<TabsProps>; TopBar: React.FC<TopBarProps>;
      BottomNav: React.FC<BottomNavProps>; AddSheet: React.FC<AddSheetProps>; ListRow: React.FC<ListRowProps>; TransactionCard: React.FC<TransactionCardProps>;
      BalanceCard: React.FC<BalanceCardProps>; FundCard: React.FC<FundCardProps>; OutstandingCard: React.FC<OutstandingCardProps>;
      ExplainBalance: React.FC<ExplainBalanceProps>; JournalLines: React.FC<JournalLinesProps>; DataTable: React.FC<DataTableProps>; FindingCard: React.FC<FindingCardProps>;
      BottomSheet: React.FC<BottomSheetProps>; Dialog: React.FC<DialogProps>; ImpactPreview: React.FC<ImpactPreviewProps>; ReviewSheet: React.FC<ReviewSheetProps>;
      ConflictMessage: React.FC<ConflictMessageProps>; Snackbar: React.FC<SnackbarProps>; Banner: React.FC<BannerProps>; Skeleton: React.FC<SkeletonProps>;
      EmptyState: React.FC<EmptyStateProps>; AccessState: React.FC<AccessStateProps>; PinPad: React.FC<PinPadProps>; OtpInput: React.FC<OtpInputProps>;
      UnlockScreen: React.FC<UnlockScreenProps>; StepUpSheet: React.FC<StepUpSheetProps>; SecurityBuilder: React.FC<SecurityBuilderProps>;
      MessagePreview: React.FC<MessagePreviewProps>; ShareConfirm: React.FC<ShareConfirmProps>; ProofCard: React.FC<ProofCardProps>; PdfPage: React.FC<PdfPageProps>;
      SplashScreen: React.FC<SplashScreenProps>; SetupWizard: React.FC<SetupWizardProps>; StatesBoard: React.FC;
      format: { inr(n: number): string; group(n: number): string; words(n: number): string; rounded(n: number): string; range(n: number): string };
      iconNames: string[];
      brand: { name: string; tagline: string };
    };
  }
}
