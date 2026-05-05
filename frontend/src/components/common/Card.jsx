import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const classes = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    hoverable && 'card-hoverable',
    onClick && 'card-clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Card Header Sub-component
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

// Card Body Sub-component
const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Sub-component
const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

// Card Image Sub-component
const CardImage = ({ src, alt, aspectRatio = '16/9', className = '', ...props }) => (
  <div 
    className={`card-image ${className}`} 
    style={{ aspectRatio }}
    {...props}
  >
    <img src={src} alt={alt} />
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Image = CardImage;

export default Card;
