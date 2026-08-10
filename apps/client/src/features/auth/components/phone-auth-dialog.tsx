import { Button } from "@bead/ui/components/button";
import { Checkbox } from "@bead/ui/components/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@bead/ui/components/field";
import { Input } from "@bead/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@bead/ui/components/input-otp";
import { ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { authClient } from "@/features/auth/auth-client";
import { NativeBackDialog } from "@/features/native/native-back-overlays";

const phoneNumberPattern = /^\+[1-9]\d{6,14}$/;
const otpLength = 6;
const resendCooldownDuration = 60;
const otpSlots = [
  { id: "first", index: 0 },
  { id: "second", index: 1 },
  { id: "third", index: 2 },
  { id: "fourth", index: 3 },
  { id: "fifth", index: 4 },
  { id: "sixth", index: 5 },
] as const;

type AuthStep = "phone" | "code";

export function PhoneAuthDialog({
  onAuthenticated,
  onOpenChange,
  open,
}: {
  onAuthenticated: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown === 0) {
      return;
    }

    const timeout = window.setTimeout(
      () => setResendCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  async function sendCode(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!phoneNumberPattern.test(normalizedPhoneNumber)) {
      setErrorMessage("请输入有效手机号");
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      const result = await authClient.phoneNumber.sendOtp({
        phoneNumber: normalizedPhoneNumber,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "验证码发送失败");
        return;
      }

      setPhoneNumber(normalizedPhoneNumber);
      setResendCooldown(resendCooldownDuration);
      setStep("code");
    } catch {
      setErrorMessage("验证码发送失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== otpLength) {
      setErrorMessage("请输入 6 位验证码");
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      const result = await authClient.phoneNumber.verify({
        code,
        phoneNumber,
      });

      if (result.error) {
        setErrorMessage("验证码错误或已过期");
        return;
      }

      onOpenChange(false);
      await onAuthenticated();
    } catch {
      setErrorMessage("验证失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    if (resendCooldown > 0) {
      return;
    }

    setCode("");
    setErrorMessage(undefined);
    setIsResending(true);

    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber });

      if (result.error) {
        setErrorMessage(result.error.message ?? "验证码发送失败");
        return;
      }

      setResendCooldown(resendCooldownDuration);
    } catch {
      setErrorMessage("验证码发送失败，请稍后重试");
    } finally {
      setIsResending(false);
    }
  }

  function editPhoneNumber() {
    setCode("");
    setErrorMessage(undefined);
    setStep("phone");
  }

  return (
    <NativeBackDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="phone-auth-description"
        className="overflow-hidden rounded-lg p-0 sm:max-w-[25rem]"
      >
        {step === "phone" ? (
          <form
            className="grid gap-6 px-6 pt-8 pb-6 sm:px-8"
            onSubmit={(event) => void sendCode(event)}
          >
            <AuthHeader title="登录 Bead" />
            <div className="grid gap-4">
              <Field data-invalid={Boolean(errorMessage)}>
                <FieldLabel className="sr-only" htmlFor="auth-phone-number">
                  手机号
                </FieldLabel>
                <Input
                  aria-invalid={Boolean(errorMessage)}
                  autoComplete="tel"
                  autoFocus
                  className="h-10"
                  disabled={isSubmitting}
                  id="auth-phone-number"
                  inputMode="tel"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="请输入手机号"
                  type="tel"
                  value={phoneNumber}
                />
                <FieldError>{errorMessage}</FieldError>
              </Field>
              <Button
                className="h-10 w-full"
                disabled={isSubmitting || !hasAcceptedTerms}
                type="submit"
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
                {isSubmitting ? "正在发送" : "发送验证码"}
              </Button>
            </div>
            <Field orientation="horizontal" className="items-center gap-3">
              <Checkbox
                checked={hasAcceptedTerms}
                className="rounded-full"
                id="auth-terms"
                onCheckedChange={(checked) =>
                  setHasAcceptedTerms(checked === true)
                }
              />
              <FieldLabel
                className="text-muted-foreground text-xs leading-5 font-normal"
                htmlFor="auth-terms"
              >
                未注册手机号登录后将自动生成账号，且代表你已阅读并同意《用户服务协议》、《隐私政策》
              </FieldLabel>
            </Field>
          </form>
        ) : (
          <form
            className="relative grid gap-6 px-6 pt-8 pb-6 sm:px-8"
            onSubmit={(event) => void verifyCode(event)}
          >
            <Button
              aria-label="修改手机号"
              className="absolute top-3 left-3"
              disabled={isSubmitting || isResending}
              onClick={editPhoneNumber}
              size="icon-sm"
              title="修改手机号"
              type="button"
              variant="ghost"
            >
              <ArrowLeft />
            </Button>
            <AuthHeader
              description={`输入发送至 ${phoneNumber} 的 6 位验证码`}
              title="验证手机号"
            />
            <div className="grid gap-4">
              <Field data-invalid={Boolean(errorMessage)}>
                <FieldLabel className="sr-only" htmlFor="auth-phone-code">
                  验证码
                </FieldLabel>
                <InputOTP
                  aria-invalid={Boolean(errorMessage)}
                  autoComplete="one-time-code"
                  autoFocus
                  containerClassName="justify-center"
                  disabled={isSubmitting || isResending}
                  id="auth-phone-code"
                  inputMode="numeric"
                  maxLength={otpLength}
                  onChange={setCode}
                  pattern="[0-9]*"
                  value={code}
                >
                  <InputOTPGroup>
                    {otpSlots.map((slot) => (
                      <InputOTPSlot
                        className="size-10"
                        index={slot.index}
                        key={slot.id}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldError className="text-center">{errorMessage}</FieldError>
              </Field>
              <Button
                className="h-10 w-full"
                disabled={
                  isSubmitting || isResending || code.length !== otpLength
                }
                type="submit"
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
                {isSubmitting ? "正在验证" : "继续发布"}
              </Button>
            </div>
            <Button
              className="mx-auto h-auto px-0 text-muted-foreground"
              disabled={isSubmitting || isResending || resendCooldown > 0}
              onClick={() => void resendCode()}
              size="sm"
              type="button"
              variant="link"
            >
              {isResending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              {isResending
                ? "正在重新发送"
                : resendCooldown > 0
                  ? `${resendCooldown} 秒后可重新发送`
                  : "重新发送验证码"}
            </Button>
          </form>
        )}
      </DialogContent>
    </NativeBackDialog>
  );
}

function AuthHeader({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <DialogHeader className="items-center gap-1.5 text-center">
      <div className="mb-3 flex items-center">
        <BeadMark />
      </div>
      <DialogTitle className="text-xl leading-tight font-semibold">
        {title}
      </DialogTitle>
      {description ? (
        <DialogDescription
          className="max-w-72 text-balance"
          id="phone-auth-description"
        >
          {description}
        </DialogDescription>
      ) : (
        <DialogDescription className="sr-only" id="phone-auth-description">
          使用手机号登录 Bead
        </DialogDescription>
      )}
    </DialogHeader>
  );
}

function BeadMark() {
  return (
    <div
      aria-hidden="true"
      className="grid size-10 grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1.5"
    >
      <span className="rounded-full bg-red-400" />
      <span className="rounded-full bg-amber-300" />
      <span className="rounded-full bg-sky-400" />
      <span className="rounded-full bg-emerald-400" />
      <span className="rounded-full bg-foreground" />
      <span className="rounded-full bg-pink-400" />
      <span className="rounded-full bg-violet-400" />
      <span className="rounded-full bg-orange-400" />
      <span className="rounded-full bg-cyan-400" />
    </div>
  );
}

function normalizePhoneNumber(value: string) {
  const normalizedValue = value.trim().replace(/[\s()-]/g, "");

  if (/^1\d{10}$/.test(normalizedValue)) {
    return `+86${normalizedValue}`;
  }

  return normalizedValue;
}
