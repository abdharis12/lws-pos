export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <img src="/img/lws-logo.png" alt="LW's by Bubur Kang LW" className="h-8 w-auto" />
            <span className="flex flex-col">
                <span className="font-display text-sm font-semibold leading-tight text-[#FAF8F5]">LW's</span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#CFC0A4', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    by Bubur Kang LW
                </span>
            </span>
        </div>
    );
}
