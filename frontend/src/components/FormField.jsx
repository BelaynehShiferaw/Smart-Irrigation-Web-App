/**
 * Reusable form field with:
 *  - label + optional required star
 *  - input / textarea / select
 *  - inline error with icon
 *  - green checkmark when valid and touched
 *  - password strength bar (opt-in)
 */
import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { passwordStrength, strengthLabel, strengthColor } from '../utils/validation';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  autoFocus,
  children,           // for <select> children
  isTextarea,
  showStrength,       // show password strength bar
  showPasswordToggle = false,
  language = 'en',
  hint,               // small helper text below field
  disabled,
  min,
  max,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasError   = touched && error;
  const isValid    = touched && !error && value !== '' && value !== undefined;
  const strength   = showStrength ? passwordStrength(value || '') : 0;

  const borderColor = hasError ? '#ef4444' : isValid ? '#10b981' : 'var(--border)';
  const boxShadow   = hasError
    ? '0 0 0 3px rgba(239,68,68,0.15)'
    : isValid
    ? '0 0 0 3px rgba(16,185,129,0.15)'
    : 'none';

  const inputStyle = {
    width: '100%',
    padding: '10px 38px 10px 14px',
    borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    background: 'var(--surface)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div className="fv-group">
      {label && (
        <label className="fv-label">
          {label}
          {required && <span className="fv-required">*</span>}
        </label>
      )}

      <div className="fv-input-wrap">
        {isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={5}
            style={{ ...inputStyle, padding: '10px 14px', resize: 'vertical' }}
          />
        ) : children ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {children}
          </select>
        ) : (
          <input
            type={showPasswordToggle && passwordVisible ? 'text' : type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            autoFocus={autoFocus}
            disabled={disabled}
            min={min}
            max={max}
            style={inputStyle}
          />
        )}

        {/* Status icon — only for text inputs */}
        {!isTextarea && !children && (hasError || isValid) && (
          <span className="fv-icon" style={showPasswordToggle ? { right: 40 } : undefined}>
            {hasError && <span style={{ color: '#ef4444' }}>✕</span>}
            {isValid  && <span style={{ color: '#10b981' }}>✓</span>}
          </span>
        )}
        {showPasswordToggle && !isTextarea && !children && (
          <button
            type="button"
            onClick={() => setPasswordVisible(visible => !visible)}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            title={passwordVisible ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              border: 0,
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {passwordVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Password strength bar */}
      {showStrength && value && (
        <div className="fv-strength">
          <div className="fv-strength-bars">
            {[1,2,3,4].map(i => (
              <div
                key={i}
                className="fv-strength-bar"
                style={{ background: i <= strength ? strengthColor[strength] : 'var(--border)' }}
              />
            ))}
          </div>
          <span className="fv-strength-label" style={{ color: strengthColor[strength] }}>
            {strengthLabel[language][strength]}
          </span>
        </div>
      )}

      {/* Hint text */}
      {hint && !hasError && (
        <p className="fv-hint">{hint}</p>
      )}

      {/* Error message */}
      {hasError && (
        <p className="fv-error" role="alert">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
