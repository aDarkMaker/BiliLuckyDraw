package event

type Emitter interface {
	Emit(name string, data ...any) bool
}
