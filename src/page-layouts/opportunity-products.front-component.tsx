import { useEffect, useMemo, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

export const OPPORTUNITY_PRODUCTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '9fdd2795-3469-40aa-a646-badc31af9384';

type ProductLine = {
  product: string;
  unit: string;
  price: string;
};

type StoredProductLine = {
  product: string;
  unit: number;
  price: number;
};

type JsonRecord = Record<string, unknown>;

const EMPTY_LINE: ProductLine = {
  product: '',
  unit: '',
  price: '',
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapOpportunity = (response: unknown): JsonRecord => {
  if (!isRecord(response)) {
    return {};
  }

  if (isRecord(response.opportunity)) {
    return response.opportunity;
  }

  if (isRecord(response.data)) {
    if (isRecord(response.data.opportunity)) {
      return response.data.opportunity;
    }

    return response.data;
  }

  return response;
};

const normalizeProducts = (value: unknown): ProductLine[] => {
  let parsedValue = value;

  if (typeof parsedValue === 'string') {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .filter(isRecord)
    .map((item) => ({
      product: typeof item.product === 'string' ? item.product : '',
      unit:
        typeof item.unit === 'number' || typeof item.unit === 'string'
          ? String(item.unit)
          : '',
      price:
        typeof item.price === 'number' || typeof item.price === 'string'
          ? String(item.price)
          : '',
    }));
};

const parseNumber = (value: string): number => {
  const normalized = value.replace(',', '.').trim();

  if (normalized === '') {
    return 0;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number): string =>
  `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} €`;

const OpportunityProductsEditor = () => {
  const selectedRecordIds = useSelectedRecordIds();

  const recordId =
    selectedRecordIds.length === 1 ? selectedRecordIds[0] : null;

  const client = useMemo(() => new RestApiClient(), []);

  const [lines, setLines] = useState<ProductLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalValue = lines.reduce(
    (sum, line) => sum + parseNumber(line.price),
    0,
  );

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      if (!recordId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await client.get(
          `/rest/opportunities/${recordId}`,
        );

        if (cancelled) {
          return;
        }

        const opportunity = unwrapOpportunity(response);

        setLines(
          normalizeProducts(opportunity.sponsorshipProducts),
        );

        setHasChanges(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(error);
        setErrorMessage('Could not load products.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [client, recordId]);

  const updateLine = (
    index: number,
    field: keyof ProductLine,
    value: string,
  ) => {
    setLines((currentLines) =>
      currentLines.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, [field]: value }
          : line,
      ),
    );

    setHasChanges(true);
  };

  const addLine = () => {
    setLines((currentLines) => [
      ...currentLines,
      { ...EMPTY_LINE },
    ]);

    setHasChanges(true);
  };

  const removeLine = (index: number) => {
    setLines((currentLines) =>
      currentLines.filter((_, lineIndex) => lineIndex !== index),
    );

    setHasChanges(true);
  };

  const saveProducts = async () => {
    if (!recordId || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const productsToSave: StoredProductLine[] = lines
      .filter(
        (line) =>
          line.product.trim() !== '' ||
          line.unit.trim() !== '' ||
          line.price.trim() !== '',
      )
      .map((line) => ({
        product: line.product.trim(),
        unit: parseNumber(line.unit),
        price: parseNumber(line.price),
      }));

    const calculatedTotal = productsToSave.reduce(
      (sum, line) => sum + line.price,
      0,
    );

    try {
      await client.patch(
        `/rest/opportunities/${recordId}`,
        {
          sponsorshipProducts: productsToSave,

          totalValue: {
            amountMicros: Math.round(
              calculatedTotal * 1_000_000,
            ),
            currencyCode: 'EUR',
          },
        },
      );

      setLines(
        productsToSave.map((line) => ({
          product: line.product,
          unit: String(line.unit),
          price: String(line.price),
        })),
      );

      setHasChanges(false);

      await enqueueSnackbar({
        message: 'Products saved',
        variant: 'success',
      });
    } catch (error) {
      console.error(error);

      setErrorMessage('Could not save products.');

      await enqueueSnackbar({
        message: 'Could not save products',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shellStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '20px 22px 24px',
    fontFamily: 'sans-serif',
  };

  const mutedStyle = {
    color: 'inherit',
    opacity: 0.58,
  };

  const cardStyle = {
    border: '1px solid rgba(127,127,127,0.20)',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(127,127,127,0.025)',
  };

  const headerCellStyle = {
    padding: '9px 12px',
    textAlign: 'left' as const,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
    opacity: 0.58,
    borderBottom: '1px solid rgba(127,127,127,0.18)',
  };

  const cellStyle = {
    padding: '7px 10px',
    borderBottom: '1px solid rgba(127,127,127,0.12)',
    verticalAlign: 'middle' as const,
  };

  const inputStyle = {
    width: '100%',
    minHeight: '34px',
    boxSizing: 'border-box' as const,
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '7px 9px',
    background: 'transparent',
    color: 'inherit',
    outline: 'none',
  };

  const secondaryButtonStyle = {
    border: '1px solid rgba(127,127,127,0.26)',
    borderRadius: '6px',
    padding: '7px 10px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '13px',
  };

  const primaryButtonStyle = {
    border: '1px solid rgba(127,127,127,0.34)',
    borderRadius: '6px',
    padding: '8px 14px',
    background: 'rgba(127,127,127,0.13)',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  };

  if (!recordId) {
    return (
      <div style={shellStyle}>
        Open a single opportunity to edit its products.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={shellStyle}>
        <span style={mutedStyle}>
          Loading products…
        </span>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '14px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            Sponsorship products
          </div>

          <div
            style={{
              ...mutedStyle,
              marginTop: '3px',
              fontSize: '12px',
            }}
          >
            Products and services contributed in this opportunity.
          </div>
        </div>

        <button
          type="button"
          onClick={addLine}
          style={secondaryButtonStyle}
        >
          + Add product
        </button>
      </div>

      {errorMessage ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '9px 11px',
            border:
              '1px solid rgba(127,127,127,0.30)',
            borderRadius: '7px',
            fontSize: '13px',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      <div style={cardStyle}>
        {lines.length === 0 ? (
          <div
            style={{
              padding: '38px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              No products added
            </div>

            <div
              style={{
                ...mutedStyle,
                marginTop: '5px',
                marginBottom: '14px',
                fontSize: '12px',
              }}
            >
              Add the products or services included in the sponsorship.
            </div>

            <button
              type="button"
              onClick={addLine}
              style={secondaryButtonStyle}
            >
              + Add first product
            </button>
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    ...headerCellStyle,
                    width: '38px',
                    textAlign: 'center',
                  }}
                >
                  #
                </th>

                <th style={headerCellStyle}>
                  Product
                </th>

                <th
                  style={{
                    ...headerCellStyle,
                    width: '110px',
                    textAlign: 'right',
                  }}
                >
                  Unit
                </th>

                <th
                  style={{
                    ...headerCellStyle,
                    width: '150px',
                    textAlign: 'right',
                  }}
                >
                  Price
                </th>

                <th
                  style={{
                    ...headerCellStyle,
                    width: '42px',
                  }}
                />
              </tr>
            </thead>

            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td
                    style={{
                      ...cellStyle,
                      textAlign: 'center',
                      opacity: 0.48,
                      fontSize: '12px',
                    }}
                  >
                    {index + 1}
                  </td>

                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={line.product}
                      placeholder="e.g. Carbon fiber"
                      onChange={(event) =>
                        updateLine(
                          index,
                          'product',
                          event.target.value,
                        )
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={cellStyle}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={line.unit}
                      placeholder="0"
                      onChange={(event) =>
                        updateLine(
                          index,
                          'unit',
                          event.target.value,
                        )
                      }
                      style={{
                        ...inputStyle,
                        textAlign: 'right',
                      }}
                    />
                  </td>

                  <td style={cellStyle}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={line.price}
                        placeholder="0.00"
                        onChange={(event) =>
                          updateLine(
                            index,
                            'price',
                            event.target.value,
                          )
                        }
                        style={{
                          ...inputStyle,
                          textAlign: 'right',
                        }}
                      />

                      <span
                        style={{
                          opacity: 0.45,
                          fontSize: '13px',
                        }}
                      >
                        €
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      textAlign: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        removeLine(index)
                      }
                      aria-label={`Remove product ${index + 1}`}
                      title="Remove"
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: 'inherit',
                        opacity: 0.5,
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        padding: '5px',
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            padding: '12px 14px',
            background:
              'rgba(127,127,127,0.035)',
          }}
        >
          <button
            type="button"
            onClick={addLine}
            style={{
              border: 0,
              padding: 0,
              background: 'transparent',
              color: 'inherit',
              opacity: 0.68,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add another product
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
            }}
          >
            <span
              style={{
                ...mutedStyle,
                fontSize: '12px',
              }}
            >
              Total Value
            </span>

            <span
              style={{
                fontSize: '19px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          marginTop: '12px',
        }}
      >
        {hasChanges ? (
          <span
            style={{
              ...mutedStyle,
              fontSize: '11px',
            }}
          >
            Unsaved changes
          </span>
        ) : null}

        <button
          type="button"
          onClick={saveProducts}
          disabled={isSaving || !hasChanges}
          style={{
            ...primaryButtonStyle,

            opacity:
              isSaving || !hasChanges
                ? 0.45
                : 1,

            cursor:
              isSaving || !hasChanges
                ? 'default'
                : 'pointer',
          }}
        >
          {isSaving
            ? 'Saving…'
            : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    OPPORTUNITY_PRODUCTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,

  name: 'opportunity-products-editor',

  description:
    'Inline editor for sponsorship products on an opportunity.',

  component: OpportunityProductsEditor,
});
