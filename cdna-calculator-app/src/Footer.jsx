// src/Footer.jsx

// 1. Importe a imagem do seu logo
import logoLaboratorio from './assets/litex.png'; // <-- IMPORTANTE: Troque 'logo-lab.png' pelo nome exato do seu arquivo!

function Footer() {
  return (
    <footer className="w-full mt-12 py-4 flex items-center justify-center text-sm text-gray-500">
      <div className="flex items-center gap-3">
        {/* 2. Use a imagem importada aqui */}
        <img src={logoLaboratorio} alt="Logo do Laboratório" className="h-12" />
        
        {/* 3. Adicione o texto da sua assinatura */}
        <span>
          Desenvolvido por: Lennon P Caires| © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}

export default Footer;