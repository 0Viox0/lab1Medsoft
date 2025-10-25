import { useEffect, useState, type FC } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApi } from "@/shared/hooks/useApi";

export type VisitFormData = {
  patientReference: string;
  patientDisplay: string;
  practitionerReference: string;
  practitionerDisplay: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  location: string;
  reasonCodes: string;
};

export type VisitData = {
  status: string;
  patient: {
    reference: string;
    display: string;
  };
  practitioner: {
    reference: string;
    display: string;
  };
  periodStart: string;
  periodEnd: string;
  location: string;
  reasonCodes: string[];
};

export type RegisterVisitProps = {
  predefinedVisitData?: VisitData["patient"];
  className?: string;
};

export const RegisterVisitForm: FC<RegisterVisitProps> = ({
  predefinedVisitData,
  className,
}) => {
  const [formData, setFormData] = useState<VisitFormData>({
    patientReference: predefinedVisitData?.reference ?? "",
    patientDisplay: predefinedVisitData?.display ?? "",
    practitionerReference: "",
    practitionerDisplay: "",
    status: "in-progress",
    periodStart: "",
    periodEnd: "",
    location: "",
    reasonCodes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const api = useApi();

  useEffect(() => {
    if (predefinedVisitData) {
      setFormData((prevData) => ({
        ...prevData,
        patientReference:
          predefinedVisitData?.reference || prevData.patientReference,
        patientDisplay: predefinedVisitData?.display || prevData.patientDisplay,
      }));
    }
  }, [predefinedVisitData]);

  const resetRegisterVisitForm = () => {
    setFormData({
      patientReference: "",
      patientDisplay: "",
      practitionerReference: "",
      practitionerDisplay: "",
      status: "finished",
      periodStart: "",
      periodEnd: "",
      location: "",
      reasonCodes: "",
    });
  };

  const handleInputChange = <T extends keyof VisitFormData>(
    field: T,
    value: VisitFormData[T],
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Преобразуем reasonCodes в массив
      const reasonCodesArray = formData.reasonCodes
        ? formData.reasonCodes
            .split(",")
            .map((code) => code.trim())
            .filter((code) => code)
        : [];

      const visitData = {
        status: formData.status,
        patient: {
          reference: formData.patientReference,
          display: formData.patientDisplay,
        },
        practitioner: {
          reference: formData.practitionerReference,
          display: formData.practitionerDisplay,
        },
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd || new Date().toISOString(),
        location: formData.location,
        reasonCodes: reasonCodesArray,
      };

      const registerResult = await api.registerVisit(visitData);

      if (registerResult.ok) {
        resetRegisterVisitForm();
      }

      setSubmitMessage(registerResult.message);
    } catch (error: unknown) {
      setSubmitMessage(`Ошибка сети: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("p-6 max-w-4xl mx-auto", className)}>
      <h1 className="text-2xl font-bold mb-6">
        Регистрация посещения пациента
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Информация о пациенте */}
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Информация о пациенте</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Patient Reference *
              </label>
              <Input
                value={formData.patientReference}
                placeholder="Patient/12345"
                className="w-full"
                onChange={(event) =>
                  handleInputChange("patientReference", event.target.value)
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Формат: Patient/ID
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Patient Display *
              </label>
              <Input
                value={formData.patientDisplay}
                placeholder="Иван Петров"
                className="w-full"
                onChange={(event) =>
                  handleInputChange("patientDisplay", event.target.value)
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Информация о враче */}
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Информация о враче</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Practitioner Reference *
              </label>
              <Input
                value={formData.practitionerReference}
                placeholder="Practitioner/67890"
                className="w-full"
                onChange={(event) =>
                  handleInputChange("practitionerReference", event.target.value)
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Формат: Practitioner/ID
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Practitioner Display *
              </label>
              <Input
                value={formData.practitionerDisplay}
                placeholder="Доктор Смирнова"
                className="w-full"
                onChange={(event) =>
                  handleInputChange("practitionerDisplay", event.target.value)
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Статус и время посещения */}
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Детали посещения</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Статус *</label>
              <select
                value={formData.status}
                className="w-full p-2 border rounded-md bg-black"
                onChange={(event) =>
                  handleInputChange("status", event.target.value)
                }
              >
                <option value="planned">Запланирован</option>
                <option value="in-progress">В процессе</option>
                <option value="finished">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Начало посещения *
              </label>
              <Input
                type="datetime-local"
                value={formData.periodStart}
                className="w-full"
                onChange={(event) =>
                  handleInputChange("periodStart", event.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Конец посещения
              </label>
              <Input
                type="datetime-local"
                value={formData.periodEnd}
                className="w-full"
                onChange={(event) =>
                  handleInputChange("periodEnd", event.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-card rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">
            Дополнительная информация
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Локация</label>
              <Input
                value={formData.location}
                placeholder="main-clinic, emergency-room, etc."
                className="w-full"
                onChange={(event) =>
                  handleInputChange("location", event.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Коды причин (через запятую)
              </label>
              <Input
                value={formData.reasonCodes}
                placeholder="185349003, 390906007"
                className="w-full"
                onChange={(event) =>
                  handleInputChange("reasonCodes", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Примеры: 185349003 (Follow-up), 390906007 (Follow-up encounter)
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка отправки и сообщение */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium",
              "hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isSubmitting ? "Отправка..." : "Зарегистрировать посещение"}
          </button>

          {submitMessage && (
            <div
              className={cn(
                "px-4 py-2 rounded-md text-sm",
                submitMessage.includes("Ошибка")
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-green-100 text-green-800",
              )}
            >
              {submitMessage}
            </div>
          )}
        </div>
      </form>

      {/* Справка по кодам причин */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">
          Справка по кодам причин посещения:
        </h3>
        <ul className="text-sm space-y-1">
          <li>
            <strong>185349003</strong> - Follow-up visit
          </li>
          <li>
            <strong>270427003</strong> - Patient-initiated encounter
          </li>
          <li>
            <strong>308335008</strong> - Patient visit
          </li>
          <li>
            <strong>390906007</strong> - Follow-up encounter
          </li>
          <li>
            <strong>185317003</strong> - Visit for check-up
          </li>
        </ul>
      </div>
    </div>
  );
};
